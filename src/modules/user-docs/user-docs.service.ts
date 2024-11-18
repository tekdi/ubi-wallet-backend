import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDoc } from './entity/user-doc.entity';
import { CreateUserDocDto } from './dto/create-user-doc.dto';
import { ErrorResponse } from 'src/common/responses/error-response';
import { SuccessResponse } from 'src/common/responses/success-response';
import axios from 'axios'
@Injectable()
export class UserDocsService {
  constructor(
    @InjectRepository(UserDoc)
    private userDocsRepository: Repository<UserDoc>,
  ) {}

  async create(createUserDocDto: CreateUserDocDto, vcfile:any){
    try {
      if(createUserDocDto.doc_id != undefined){
        try {
          const docData = await this.fetchDocData(createUserDocDto.doc_id);
          createUserDocDto.doc_data = docData;
          createUserDocDto.issuer = docData.issuer;
        } catch (error) {
          console.log(error);
          if (error instanceof NotFoundException) {
            return new ErrorResponse({
              statusCode: 404,
              errorMessage: error.message,
            });
          }
          throw error;
        }
      }else if(vcfile != undefined){
        const vcJsonString = vcfile.buffer.toString();
        const vcJsonData = JSON.parse(vcJsonString);
        createUserDocDto.doc_id = vcJsonData.id;
        createUserDocDto.doc_data = vcJsonData;
        createUserDocDto.issuer = vcJsonData.issuer;
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
      
      const userDoc = this.userDocsRepository.create(createUserDocDto);
      await this.userDocsRepository.save(userDoc);
      return new SuccessResponse({
        statusCode: 200, // HTTP OK status
        message: 'DOCUMENTS_ADDED_SUCCESSFULLY',
        data: userDoc,
      });
    }
    catch(error) {
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
      throw new Error(`Failed to fetch doc_data for doc_id: ${doc_id} - ${error.message}`);
    }
  }
}
