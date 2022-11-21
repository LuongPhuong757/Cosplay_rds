import { toYearMonth } from '@common/util/to-year-month';
import dayjs from 'dayjs';
import { Service } from 'typedi';
import { CotHistoryRepository } from './cot-history.repository';
import { MonthlyCot } from './interface/monthly-cot';

@Service()
export class CotHistoryService {
  constructor(private readonly cotHistoryRepository: CotHistoryRepository) {}

  async getMonthlyCots(userId: number): Promise<MonthlyCot[]> {
    const cots = await this.cotHistoryRepository.findMany({
      select: {
        amount: true,
        created: true,
      },
      where: {
        userId,
        created: {
          gt: dayjs().subtract(1, 'years').toDate(),
        },
      },
    });

    return cots.reduce((result: { month: string; amount: number }[], current) => {
      const element = result.find((item) => item.month === toYearMonth(current.created));

      if (element) {
        element.amount += current.amount;
      } else {
        result.push({
          month: toYearMonth(current.created),
          amount: current.amount,
        });
      }

      return result;
    }, []);
  }
}
