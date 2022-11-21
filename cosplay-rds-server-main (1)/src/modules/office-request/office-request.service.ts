import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { OfficeRepository } from '@modules/office/office.repository';
import { User } from '@prisma/client';
import { Service } from 'typedi';
import { OfficeRequestStatus } from './enum/office-request-status';
import { OfficeRequest } from './office-request.model';
import { OfficeRequestRepository } from './office-request.repository';

@Service()
export class OfficeRequestService {
  constructor(
    private readonly officeRequestRepository: OfficeRequestRepository,
    private readonly officeRepository: OfficeRepository,
  ) {}

  async getOfficeRequests(
    { id: userId }: User,
    pagingOptions?: PagingOptionsInput,
  ): Promise<OfficeRequest[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.officeRequestRepository.findMany({
      ...pagingOptionsQuery,
      where: {
        layerId: userId,
        status: OfficeRequestStatus.REQUESTING,
      },
      include: {
        office: {
          include: {
            owner: true,
          },
        },
      },
    });
  }

  async createOfficeRequest({ id: userId }: User, layerId: number): Promise<OfficeRequest> {
    const office = await this.officeRepository.findOffice(userId);

    const oldOfficeRequest = await this.officeRequestRepository.findFirst({
      where: {
        officeId: office.id,
        layerId,
        status: OfficeRequestStatus.REQUESTING,
      },
    });
    if (oldOfficeRequest) {
      throw new Error('you are already requesting office request');
    }

    return await this.officeRequestRepository.create({
      data: {
        officeId: office.id,
        layerId,
        status: OfficeRequestStatus.REQUESTING,
      },
    });
  }

  async approveOfficeRequest({ id: userId }: User, officeRequestId: number): Promise<number> {
    try {
      await this.isRequstingOfficeRequest(officeRequestId);

      const updatedOfficeRequest = await this.officeRequestRepository.update({
        where: {
          id: officeRequestId,
        },
        data: {
          status: OfficeRequestStatus.APPROVED,
          approvedAt: new Date(),
        },
      });

      await this.officeRepository.update({
        where: {
          id: updatedOfficeRequest.officeId,
        },
        data: {
          layers: {
            connect: [{ id: userId }],
          },
        },
      });

      return officeRequestId;
    } catch (error) {
      const { message } = <Error>error;
      console.error(message);

      throw Error(
        `cannot approve office request. officeRequestId: ${officeRequestId} message: ${message}.`,
      );
    }
  }

  // Rejectは消していい
  async rejectOfficeRequest(officeRequestId: number): Promise<number> {
    await this.isRequstingOfficeRequest(officeRequestId);

    try {
      await this.officeRequestRepository.delete({
        where: {
          id: officeRequestId,
        },
      });

      return officeRequestId;
    } catch (error) {
      const { message } = <Error>error;
      console.error(message);

      throw Error(
        `cannot reject office request. officeRequestId: ${officeRequestId} message: ${message}.`,
      );
    }
  }

  private async isRequstingOfficeRequest(officeRequestId: number): Promise<OfficeRequest> {
    const officeRequest = await this.officeRequestRepository.findFirst({
      where: {
        id: officeRequestId,
      },
    });
    if (!officeRequest) {
      throw new Error('not found office request');
    }
    if (officeRequest.status !== OfficeRequestStatus.REQUESTING) {
      throw new Error('invalid office request');
    }

    return officeRequest;
  }
}
