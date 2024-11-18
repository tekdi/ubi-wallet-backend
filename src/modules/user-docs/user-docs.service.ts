import { Injectable } from '@nestjs/common';
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

  async create(createUserDocDto: CreateUserDocDto){
    try {
      const docData = await this.fetchDocData(createUserDocDto.doc_id);
      createUserDocDto.doc_data=docData;
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

  async fetchByUserId(user_id: string): Promise<UserDoc[]> {
    return await this.userDocsRepository.find({ where: { user_id } });
  }

  private async fetchDocData(doc_id: string): Promise<string> {
    const apiUrl = `${process.env.SUNBIRD_RC_URL_VCDATA}/${doc_id}`;
    console.log(apiUrl)
    try {
      const response = await axios.get(apiUrl,{headers:{'Accept': 'application/json',}});
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch doc_data for doc_id: ${doc_id} - ${error.message}`);
    }
  }
}
