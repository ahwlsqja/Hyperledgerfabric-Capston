import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StreamsPublisherService } from 'src/redis/streams-publisher.service';

@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly publishService: StreamsPublisherService,
  ) {}

  @Post('register')
  async registerUser(
    @Body('userId') userId: string,
    @Body('name') name: string,
    @Body('orgType') orgType: 'STUDENT' | 'STUDENT_COUNCIL',
  ) {
    return this.organizationService.registerUser(userId, name, orgType);
  }

  // @Post('request/approve')
  // async approveRequest(
  //   @Body('requestId') requestId: string,
  //   @Body('approverId') approverId: string,
  // ) {

  //   // 스프링에 회원가입 요청 승인 이벤트 발행
  //   await this.publishService.publishBlockchainEvent(
  //     'MEMBERSHIP_REQUEST_APPROVAL',
  //     {
  //       requestId,
  //       approverId,
  //     },
  //   );
  // }

  @Put('request/:requestId/reject')
  async rejectRequest(
    @Param('requestId') requestId: string,
    @Body('rejectorId') rejectorId: string,
  ) {
    return this.organizationService.rejectRequest(requestId, rejectorId);
  }

  @Get('requests/pending')
  async getPendingRequests() {
    return this.organizationService.getPendingRequests();
  }

  @Get('request/:requestId')
  async getRequestStatus(@Param('requestId') requestId: string) {
    return this.organizationService.getRequestStatus(requestId);
  }

  @Get('members/student/count')
  async getStudentMemberCount() {
    return this.organizationService.getStudentMemberCount();
  }

  @Get('members/council/count')
  async getCouncilMemberCount() {
    return this.organizationService.getCouncilMemberCount();
  }
}