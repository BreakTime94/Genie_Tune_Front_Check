import {gql} from "@apollo/client";

export const HANDLE_REGISTER = gql`
  mutation handleRegister($input: JoinApplyRequestDTO) {
    handleRegister(input: $input) {
      result
    }
  }
`;