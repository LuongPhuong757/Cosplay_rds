import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { Service } from 'typedi';
import { NFTPrivilegeOnUsers } from './nft-privilege-on-user.model';
import { NFTPrivilegeOnUsersRepository } from './nft-privilege-on-user.repository';

@Service()
export class NFTPrivilegeOnUsersService {
  constructor(private readonly nFTPrivilegeOnUsersRepository: NFTPrivilegeOnUsersRepository) {}

  async getNftPrivilegesExecutedUsers(
    nftPrivilegeId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<NFTPrivilegeOnUsers[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);

    return await this.nFTPrivilegeOnUsersRepository.findMany({
      ...pagingOptionsQuery,
      where: {
        nftPrivilegeId,
      },
      include: {
        user: true,
      },
    });
  }
}
