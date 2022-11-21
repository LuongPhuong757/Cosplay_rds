import dayjs from 'dayjs';
import { toYearMonth } from '../../../src/common/util/to-year-month';
import { CotHistoryRepository } from '../../../src/modules/cot-history/cot-history.repository';
import { CotHistoryService } from '../../../src/modules/cot-history/cot-history.service';
import { User } from '../../../src/modules/user/user.model';
import { prisma } from '../../prisma-instance';

describe('ScoreLogService', () => {
  let cotHistoryService: CotHistoryService;
  let cotHistoryRepository: CotHistoryRepository;

  beforeAll(() => {
    cotHistoryRepository = new CotHistoryRepository(prisma);
    cotHistoryService = new CotHistoryService(cotHistoryRepository);
  });

  describe('getMonthlyCots', () => {
    let monthlyUser: User;

    beforeAll(async () => {
      monthlyUser = await prisma.user.create({
        data: {
          auth0Id: 'mc_auth0Id',
          name: 'mc_name',
          account: 'mc_account',
          icon: 'mc_icon',
          isBan: false,
          isCosplayer: false,
        },
      });
      await prisma.cotHistory.create({
        data: {
          userId: monthlyUser.id,
          amount: 100,
        },
      });
      await prisma.cotHistory.create({
        data: {
          userId: monthlyUser.id,
          amount: 50,
        },
      });
      await prisma.cotHistory.create({
        data: {
          userId: monthlyUser.id,
          amount: 10,
          created: dayjs(new Date()).subtract(1, 'month').toDate(),
        },
      });
      await prisma.cotHistory.create({
        data: {
          userId: monthlyUser.id,
          amount: 10,
          created: dayjs(new Date()).subtract(1, 'year').toDate(),
        },
      });
    });

    it('returns monthly scores.', async () => {
      const monthlyCots = await cotHistoryService.getMonthlyCots(monthlyUser.id);

      const currentMonth = toYearMonth(new Date());
      const lastMonth = toYearMonth(dayjs(new Date()).subtract(1, 'month').toDate());

      expect(monthlyCots).toHaveLength(2);
      expect(monthlyCots.map((cot) => cot.month)).toEqual([currentMonth, lastMonth]);
      expect(monthlyCots.filter((cot) => cot.month === currentMonth)[0].amount).toEqual(150);
    });
  });
});
