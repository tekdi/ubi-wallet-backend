import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDoc } from './entity/user-doc.entity';
import { CreateUserDocDto } from './dto/create-user-doc.dto';
import { ErrorResponse } from 'src/common/responses/error-response';
import { SuccessResponse } from 'src/common/responses/success-response';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class UserDocsService {
  constructor(
    @InjectRepository(UserDoc)
    private readonly userDocsRepository: Repository<UserDoc>,
  ) { }

  async create(createUserDocDto: CreateUserDocDto, vcfile: any, ssoId: string) {
    try {
      // if(createUserDocDto.doc_id != undefined){
      //   try {
      //     // const docData = await this.fetchDocData(createUserDocDto.doc_id);
      //     // createUserDocDto.doc_data = docData;
      //     createUserDocDto.issuer = createUserDocDto.doc_data.issuer;
      //   } catch (error) {
      //     console.log(error);
      //     if (error instanceof NotFoundException) {
      //       return new ErrorResponse({
      //         statusCode: 404,
      //         errorMessage: error.message,
      //       });
      //     }
      //     throw error;
      //   }
      // }else
      if (vcfile != undefined) {
        const vcJsonString = vcfile.buffer.toString();
        const vcJsonData = JSON.parse(vcJsonString);
        createUserDocDto.doc_id = vcJsonData.id;
        createUserDocDto.doc_data = vcJsonData;
        createUserDocDto.issuer = vcJsonData.issuer;
      }
      if (createUserDocDto.doc_id == undefined) {
        let uniqueUUID;
        let isUnique = false;
        while (!isUnique) {
          uniqueUUID = 'did:ew:' + uuidv4();
          const existDoc = await this.userDocsRepository.findOne({
            where: { doc_id: uniqueUUID },
          });
          if (!existDoc) {
            isUnique = true; // UUID is unique
          }
        }
        createUserDocDto.doc_id = uniqueUUID;
      }
      const existingDoc = await this.userDocsRepository.findOne({
        where: { doc_id: createUserDocDto.doc_id },
      });

      if (existingDoc) {
        return new ErrorResponse({
          statusCode: 409, // Conflict status code
          errorMessage: `Document with doc_id ${createUserDocDto.doc_id} already exists`,
        });
      }
      const checkMarksheetExists = await this.userDocsRepository.findOne({
        where: { sso_id: ssoId, doc_subtype: 'marksheet' },
      });
      // if (checkMarksheetExists && createUserDocDto.doc_subtype === 'aadhaar') {
      //   return new ErrorResponse({
      //     statusCode: 409,
      //     errorMessage: `Aadhaar already added to wallet`,
      //   });
      // }
      if (!checkMarksheetExists && createUserDocDto.doc_subtype !== 'marksheet') {
        return new ErrorResponse({
          statusCode: 400,
          errorMessage: `Please add Marksheet first before adding any other document to wallet`,
        });
      }

      const userDoc = this.userDocsRepository.create({
        ...createUserDocDto,
        sso_id: ssoId,
      });
      await this.userDocsRepository.save(userDoc);
      return new SuccessResponse({
        statusCode: 200, // HTTP OK status
        message: 'DOCUMENTS_ADDED_SUCCESSFULLY',
        data: userDoc,
      });
    } catch (error) {
      return new ErrorResponse({
        statusCode: 500, // Internal server error status
        errorMessage: `FAILED_TO_CREATE_DOCUMENT - ${error.message}`,
      });
    }
  }

  async fetchBySsoId(sso_id: string): Promise<UserDoc[]> {
    return await this.userDocsRepository.find({ where: { sso_id } });
  }

  private async fetchDocData(doc_id: string): Promise<any> {
    const apiUrl = `${process.env.SUNBIRD_RC_URL_VCDATA}/${doc_id}`;
    try {
      const response = await axios.request({
        method: 'get',
        maxBodyLength: Infinity,
        url: apiUrl,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.data) {
        throw new NotFoundException(`Document with doc_id ${doc_id} not found`);
      }

      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        throw new NotFoundException(`Document with doc_id ${doc_id} not found`);
      }
      throw new Error(
        `Failed to fetch doc_data for doc_id: ${doc_id} - ${error.message}`,
      );
    }
  }

  async delete(doc_id: string, sso_id: string) {
    // Check if document exists or not, if not then send erorr response
    const existingDoc = await this.userDocsRepository.findOne({
      where: {
        doc_id: doc_id,
      },
    });

    if (!existingDoc) {
      Logger.error(`Document with id ${doc_id} does not exists`);
      return new ErrorResponse({
        statusCode: 400,
        errorMessage: `Document with id ${doc_id} does not exists`,
      });
    }

    // Check if logged in user is allowed to delete this document or not
    if (existingDoc.sso_id !== sso_id)
      return new ErrorResponse({
        statusCode: HttpStatus.UNAUTHORIZED,
        errorMessage:
          'You are not authorized to modify or delete this resourse',
      });

    // Delete the document
    const queryRunner =
      this.userDocsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.startTransaction();
      await queryRunner.manager.remove(existingDoc);
      await queryRunner.commitTransaction();
    } catch (error) {
      Logger.error('Error while deleting the document: ', error);
      await queryRunner.release();
      return new ErrorResponse({
        statusCode: 500,
        errorMessage: `Error while deleting the document: ${error}`,
      });
    } finally {
      await queryRunner.release();
    }

    return new SuccessResponse({
      statusCode: 200,
      message: 'Document deleted successfully',
    });
  }
}
