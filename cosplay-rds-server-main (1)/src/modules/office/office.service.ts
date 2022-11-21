import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { OfficeRequestStatus } from '@modules/office-request/enum/office-request-status';
import { OfficeRequestRepository } from '@modules/office-request/office-request.repository';
import { OfficeRepository } from '@modules/office/office.repository';
import { User } from '@prisma/client';
import { Service } from 'typedi';
import { Office } from './office.model';

@Service()
export class OfficeService {
  constructor(
    private readonly officeRepository: OfficeRepository,
    private readonly officeRequestRepository: OfficeRequestRepository,
  ) {}

  async getOffice({ id: userId }: User, pagingOptions?: PagingOptionsInput): Promise<Office> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    const office = await this.officeRepository.findFirst({
      where: {
        owner: {
          id: userId,
        },
      },
      include: {
        owner: true,
        officeRequests: {
          where: {
            status: OfficeRequestStatus.REQUESTING,
          },
        },
        layers: {
          ...pagingOptionsQuery,
        },
      },
    });
    if (!office) {
      throw new Error('you are not owner of office');
    }

    return office;
  }

  async restructureLayer({ id: userId }: User, layerId: number): Promise<number> {
    try {
      const office = await this.officeRepository.findOffice(userId);

      await this.officeRepository.update({
        where: {
          id: office.id,
        },
        data: {
          layers: {
            disconnect: [{ id: layerId }],
          },
        },
      });

      const officeRequest = await this.officeRequestRepository.findFirst({
        where: {
          officeId: office.id,
          layerId,
          status: OfficeRequestStatus.APPROVED,
        },
      });
      if (!officeRequest) {
        throw new Error('something wrong with it');
      }
      await this.officeRequestRepository.update({
        where: {
          id: officeRequest.id,
        },
        data: {
          status: OfficeRequestStatus.RESTRUCTURED,
          restructuredAt: new Date(),
        },
      });

      return layerId;
    } catch (error) {
      const { message } = <Error>error;
      console.error(message);

      throw Error(`cannot restructure layer. ${message}.`);
    }
  }
}
