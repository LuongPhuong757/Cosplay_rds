import 'reflect-metadata';
import { OfficeRequestStatus } from '../../../src/modules/office-request/enum/office-request-status';
import { OfficeRequestRepository } from '../../../src/modules/office-request/office-request.repository';
import { OfficeRequestService } from '../../../src/modules/office-request/office-request.service';
import { Office } from '../../../src/modules/office/office.model';
import { OfficeRepository } from '../../../src/modules/office/office.repository';
import { User } from '../../../src/modules/user/user.model';
import { prisma } from '../../prisma-instance';

describe('OfficeRequestService', () => {
  const officeRepository = new OfficeRepository(prisma);
  const officeRequestRepository = new OfficeRequestRepository(prisma);
  const officeRequestService = new OfficeRequestService(officeRequestRepository, officeRepository);
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
        name: 'office-server1-name',
        account: 'office-server1-account',
        auth0Id: 'office-server1-auth0Id',
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
        name: 'office-server2-name',
        account: 'office-server2-account',
        auth0Id: 'office-server2-auth0Id',
      },
    });
  };

  describe('createOfficeRequest', () => {
    it('create requests', async () => {
      const result = await officeRequestService.createOfficeRequest(firstUser, secondUser.id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('layerId');
      expect(result).toHaveProperty('officeId');
      expect(result).toHaveProperty('approvedAt');
      expect(result).toHaveProperty('restructuredAt');
      expect(result.status).toBe(OfficeRequestStatus.REQUESTING);
    });

    it('invalid create', async () => {
      await expect(
        officeRequestService.createOfficeRequest(firstUser, secondUser.id),
      ).rejects.toThrow('you are already requesting office request');
    });
  });

  describe('getOfficeRequests', () => {
    it('get requests', async () => {
      const result = await officeRequestService.getOfficeRequests(secondUser);

      result.map((request) => {
        expect(request).toHaveProperty('id');
        expect(request).toHaveProperty('layerId');
        expect(request).toHaveProperty('officeId');
        expect(request).toHaveProperty('approvedAt');
        expect(request).toHaveProperty('restructuredAt');
        expect(request.status).toBe(OfficeRequestStatus.REQUESTING);
      });
    });
  });

  describe('approveOfficeRequest', () => {
    it('approve request', async () => {
      const officeRequest = await prisma.officeRequest.create({
        data: {
          officeId: office.id,
          layerId: secondUser.id,
          status: OfficeRequestStatus.REQUESTING,
        },
      });
      await officeRequestService.approveOfficeRequest(secondUser, officeRequest?.id);

      const approved = await prisma.officeRequest.findFirst({
        where: { id: officeRequest?.id },
      });
      expect(approved?.status).toBe(OfficeRequestStatus.APPROVED);
    });

    it('invalid requesting request', async () => {
      const officeRequest = await prisma.officeRequest.findFirst({
        where: {
          status: OfficeRequestStatus.APPROVED,
        },
      });
      await expect(
        officeRequestService.approveOfficeRequest(secondUser, officeRequest?.id as number),
      ).rejects.toThrow('invalid office request');
    });

    it('not found request', async () => {
      await expect(officeRequestService.approveOfficeRequest(secondUser, 10000)).rejects.toThrow(
        'not found office request',
      );
    });
  });

  describe('rejectOfficeRequest', () => {
    it('reject request', async () => {
      const officeRequest = await prisma.officeRequest.create({
        data: {
          officeId: office.id,
          layerId: secondUser.id,
          status: OfficeRequestStatus.REQUESTING,
        },
      });
      await officeRequestService.rejectOfficeRequest(officeRequest?.id);

      const rejected = await prisma.officeRequest.findFirst({
        where: { id: officeRequest?.id },
      });
      expect(rejected).toBe(null);
    });

    it('invalid requesting request', async () => {
      const officeRequest = await prisma.officeRequest.findFirst({
        where: {
          status: OfficeRequestStatus.APPROVED,
        },
      });
      await expect(
        officeRequestService.rejectOfficeRequest(officeRequest?.id as number),
      ).rejects.toThrow('invalid office request');
    });

    it('not found request', async () => {
      await expect(officeRequestService.rejectOfficeRequest(10000)).rejects.toThrow(
        'not found office request',
      );
    });
  });
});
