import 'reflect-metadata';
import { OfficeRequestStatus } from '../../../src/modules/office-request/enum/office-request-status';
import { OfficeRequestRepository } from '../../../src/modules/office-request/office-request.repository';
import { Office } from '../../../src/modules/office/office.model';
import { OfficeRepository } from '../../../src/modules/office/office.repository';
import { OfficeService } from '../../../src/modules/office/office.service';
import { User } from '../../../src/modules/user/user.model';
import { prisma } from '../../prisma-instance';

describe('OfficeService', () => {
  const officeRepository = new OfficeRepository(prisma);
  const officeRequestRepository = new OfficeRequestRepository(prisma);
  const officeService = new OfficeService(officeRepository, officeRequestRepository);
  let firstUser: User;
  let secondUser: User;
  let office: Office;

  beforeAll(async () => {
    await setup();
  });

  const setup = async () => {
    // office
    firstUser = await prisma.user.create({
      data: {
        name: 'office1-name',
        account: 'office1-account',
        auth0Id: 'office1-auth0Id',
      },
    });
    office = await prisma.office.create({
      data: {
        owner: {
          connect: {
            id: firstUser.id,
          },
        },
      },
    });
    secondUser = await prisma.user.create({
      data: {
        name: 'office2-name',
        account: 'office2-account',
        auth0Id: 'office2-auth0Id',
      },
    });
  };

  describe('getOffice', () => {
    it('returns office', async () => {
      const result = await officeService.getOffice(firstUser);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('layers');
      expect(result).toHaveProperty('officeRequests');
      expect(result).toHaveProperty('owner');
    });

    it('invalid request', async () => {
      await expect(officeService.getOffice(secondUser)).rejects.toThrow(
        'you are not owner of office',
      );
    });
  });

  describe('restructureLayer', () => {
    it('restruture layer', async () => {
      const officeRequest = await prisma.officeRequest.create({
        data: {
          officeId: office.id,
          layerId: secondUser.id,
          status: OfficeRequestStatus.APPROVED,
        },
      });
      await officeService.restructureLayer(firstUser, secondUser.id);

      const result = await prisma.officeRequest.findUnique({ where: { id: officeRequest.id } });

      expect(result?.status).toBe(OfficeRequestStatus.RESTRUCTURED);
    });

    it('invalid request', async () => {
      await expect(officeService.restructureLayer(secondUser, 1000)).rejects.toThrow(
        'you are not owner of office',
      );
    });
  });
});
