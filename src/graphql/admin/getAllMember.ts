import { gql } from '@apollo/client';

export const GET_ALL_MEMBERS = gql`
  query GetAllMembers($input: MemberPageRequest!) {
    getAllMembers(input: $input) {
      content {
        email
        organizationName
        bizNumber
        representativeName
        contactName
        role
        accountStatus
        approvedAt
        rejectReason
        registerStatus
        createdAt
        checkedAt
      }
      totalPages
      totalElements
      currentPage
      isFirst
      isLast
    }
  }
`;