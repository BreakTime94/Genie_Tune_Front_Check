"use client";

import {useEffect, useState} from "react";
import {useMutation, useQuery} from "@apollo/client";
import {GET_ALL_MEMBERS} from "@/graphql/admin/getAllMember";
import {HANDLE_REGISTER} from "@/graphql/admin/handleRegister";
import SignupRequestDetailPage from "@/app/admin/members/signup-requests/[id]/page";

type MemberStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type Role = "MEMBER" | "ADMIN" | "SUBSCRIBER";

type AccountStatus = "ACTIVE" | "INACTIVE" | "DELETED";

type MemberSearchType = "BIZ_NUMBER" | "EMAIL" | "ORGANIZATION_NAME" | "REPRESENTATIVE_NAME" | "ALL";

export type Member = {
  //indexing 기준
  email: string;
  organizationName: string;
  bizNumber: string;
  representativeName: string;
  contactName: string;
  role: Role; // Enum값 정확히 매칭
  accountStatus: AccountStatus;
  approvedAt: string | null;
  rejectReason: string | null;
  registerStatus: MemberStatus;
  createdAt: string;
  checkedAt: string | null;
};

// 2. 전체 응답 타입 (MemberPageResponse와 매칭)
export type MemberPageResponse = {
  content: Member[];          // 실제 데이터 리스트
  totalPages: number;         // 전체 페이지 수
  totalElements: number;      // 전체 데이터 개수
  currentPage: number;        // 현재 페이지 번호
  isFirst: boolean;           // 첫 페이지 여부
  isLast: boolean;            // 마지막 페이지 여부
};

const initialData: MemberPageResponse = {
  content: [],        // 처음엔 빈 배열
  totalPages: 0,
  totalElements: 0,
  currentPage: 1,     // 프론트 기준 1페이지
  isFirst: true,
  isLast: true,
};

interface SearchCondition {
  memberSearchType: string;
  keyword: string;
  registerStatus: string | null; // 핵심: string 또는 null 허용
  role: string | null;           // 핵심: string 또는 null 허용
}

const initialMember : Member = {
  email: "",
  organizationName: "",
  bizNumber: "",
  representativeName: "",
  contactName: "",
  role: "MEMBER", // Enum값 정확히 매칭
  accountStatus: "ACTIVE",
  approvedAt: "",
  rejectReason: "",
  registerStatus: "PENDING",
  createdAt: "",
  checkedAt: "",
}

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [tempCondition, setTempCondition] = useState<SearchCondition>({
    memberSearchType: "ALL",
    keyword: "",
    registerStatus: null,
    role: null
  });
  const [appliedCondition, setAppliedCondition] = useState<SearchCondition>({
    memberSearchType: "ALL",
    keyword: "",
    registerStatus: null,
    role: null
  });
  const [selectedMember, setSelectedMember] = useState<Member>(initialMember);

  const memberClick = (member: Member) => {
    console.log("클릭한 멤버:", member);
    // 행 클릭 시 상세 데이터 저장
    setSelectedMember(member)
  }

  const { loading, data, error, refetch } = useQuery(GET_ALL_MEMBERS, {
    variables: {
      input: {
        page: page,
        size: 10,
        condition: appliedCondition
    }
  },
    fetchPolicy: "network-only"
  });
  //{memberSearchType: "ALL" , registerStatus: null , keyword: "", role: null}


  const [handleRegister, { loading: mutationLoading }] = useMutation(HANDLE_REGISTER);
  useEffect(() => {
    console.log("useEffect 내부");
    console.log(data);
    if(data && data.getAllMembers) {
      setMembers(data.getAllMembers);
      console.log("state 값 가져온 값으로 변경");
    }
  }, [data]);

  const [members, setMembers] = useState<MemberPageResponse>(initialData);

  const updateStatus = async (email: string, status: MemberStatus) => {
    // 1. 필요한 값 모으기 (반려일 때만 사유 입력받기)
    let rejectReason = null;
    if (status === 'REJECTED') {
      rejectReason = prompt("반려 사유를 입력해주세요.");
      if (!rejectReason) return; // 사유 없으면 중단
    }

    try {
      // 2. State를 거치지 않고 바로 Mutation 함수에 실어서 서버로 발송!
      const { data } = await handleRegister({
        variables: {
          input: {
            email: email,
            registerStatus: status,
            rejectReason: rejectReason
          }
        }
      });

      if (data.handleRegister.success) {
        alert(`${status === 'APPROVED' ? '승인' : '반려'} 처리가 완료되었습니다.`);
        refetch(); // 서버 데이터 갱신 (화면 자동 업데이트)
      }
    } catch (e) {
      console.error("Mutation Error:", e);
    }
  };

  const getPageNumbers = () => {
    const totalPages = data?.getAllMembers.totalPages || 0;
    const currentPage = data?.getAllMembers.currentPage || 1;

    // 한 번에 보여줄 페이지 번호 개수 (10개씩)
    const blockLimit = 10;
    const currentBlock = Math.ceil(currentPage / blockLimit);

    const startPage = (currentBlock - 1) * blockLimit + 1;
    const endPage = Math.min(currentBlock * blockLimit, totalPages);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold text-[#19344e]">회원 관리</h1>
              <div className="flex flex-row gap-6 items-start">
                <div className="bg-white border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 bg-white p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      {/* 상태 필터 드롭다운 */}
                      <select
                          value={tempCondition.registerStatus || ""}
                          onChange={(e) => setTempCondition(prev => ({...prev, registerStatus: e.target.value || null}))}
                          className="text-sm border border-gray-300 px-3 py-2 outline-none focus:border-[#19344e]"
                      >
                        <option value="">전체 상태</option>
                        <option value="PENDING">승인 대기</option>
                        <option value="APPROVED">승인 완료</option>
                        <option value="REJECTED">반려</option>
                      </select>

                      {/* 권한 필터 드롭다운 */}
                      <select
                          value={tempCondition.role || ""}
                          onChange={(e) => setTempCondition(prev => ({...prev, role: e.target.value || null}))}
                          className="text-sm border border-gray-300 px-3 py-2 outline-none focus:border-[#19344e]"
                      >
                        <option value="">전체 권한</option>
                        <option value="ADMIN">관리자</option>
                        <option value="MEMBER">일반회원</option>
                        <option value="SUBSCRIBER">구독회원</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-0">
                      {/* 검색 타입 선택 */}
                      <select
                          value={tempCondition.memberSearchType}
                          onChange={(e) => setTempCondition(prev => ({...prev, memberSearchType: e.target.value}))}
                          className="text-sm border border-gray-300 px-3 py-2 outline-none focus:border-[#19344e] bg-gray-50"
                      >
                        <option value="ALL">전체 검색</option>
                        <option value="EMAIL">이메일</option>
                        <option value="ORGANIZATION_NAME">기관명</option>
                        <option value="BIZ_NUMBER">사업자번호</option>
                        <option value="REPRESENTATIVE_NAME">대표자명</option>
                      </select>

                      {/* 검색어 입력칸 */}
                      <input
                          type="text"
                          placeholder="검색어를 입력하세요"
                          value={tempCondition.keyword || ""}
                          onChange={(e) => setTempCondition(prev => ({...prev, keyword: e.target.value}))}
                          onKeyDown={(e) => e.key === 'Enter' && setPage(1)} // 엔터 시 검색 실행
                          className="text-sm border border-l-0 border-gray-300 px-4 py-2 w-64 outline-none focus:border-[#19344e]"
                      />

                      {/* 검색 버튼 */}
                      <button
                          onClick={() => {
                            setPage(1)
                            setAppliedCondition(tempCondition);
                      }}
                          className="bg-[#19344e] text-white px-5 py-2 text-sm font-medium hover:bg-[#2c4a6b] transition-colors"
                      >
                        검색
                      </button>
                    </div>
                  </div>
                    <table className="w-full text-sm">
                        <thead className="bg-[#F4F6FF] text-[#19344e]">
                        <tr>
                            <th className="px-4 py-3 text-left">기관명</th>
                            <th className="px-4 py-3 text-left">담당자</th>
                            <th className="px-14 py-3 text-left">이메일</th>
                            <th className="px-7 py-3 text-left">가입일</th>
                            <th className="px-7 py-3 text-left">상태</th>
                            <th className="px-11 py-3 text-left">관리</th>
                        </tr>
                        </thead>
                        <tbody>
                        {members.content.map(member => (
                            <tr
                                key={member.email}
                                className={`border-t cursor-pointer hover:bg-gray-50 ${selectedMember?.email === member.email ? 'bg-blue-50' : ''}`}
                                onClick={() => memberClick(member)}
                            >
                                <td className="px-4 py-3">{member.organizationName}</td>
                                <td className="px-4 py-3">{member.contactName}</td>
                                <td className="px-4 py-3">{member.email}</td>
                                <td className="px-4 py-3">{member.createdAt}</td>
                                <td className="px-4 py-3">
                                    {member.registerStatus === "PENDING" && (
                                        <span className="text-[#fD91c]">승인 대기</span>
                                    )}
                                    {member.registerStatus === "APPROVED" && (
                                        <span className="text-green-600">승인 완료</span>
                                    )}
                                    {member.registerStatus === "REJECTED" && (
                                        <span className="text-red-500">반려</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 space-x-2">
                                    <button
                                        onClick={() => updateStatus(member.email, "APPROVED")}
                                        className="text-xs px-2 py-1 border hover:brightness-5 cursor-pointer"
                                    >
                                        승인
                                    </button>
                                    <button
                                        onClick={() => updateStatus(member.email, "REJECTED")}
                                        className="text-xs px-2 py-1 border hover:brightness-5 cursor-pointer"
                                    >
                                        반려
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                  <div className="flex items-center justify-center space-x-1 py-6 border-t border-gray-200 bg-gray-50/50">
                    {/* 맨 처음으로 (<<) */}
                    {data?.getAllMembers.isLast && (<button
                        onClick={() => setPage(1)}
                        className="px-2 py-1 text-gray-400 hover:text-[#19344e] disabled:opacity-30 cursor-pointer"
                    >
                      &laquo;
                    </button>)}

                    {/* 이전 한 칸 (<) */}
                    <button
                        disabled={data?.getAllMembers.isFirst}
                        onClick={() => setPage(prev => prev - 1)}
                        className="px-2 py-1 text-gray-400 hover:text-[#19344e] disabled:opacity-30 cursor-pointer mr-2"
                    >
                      &lt;
                    </button>

                    {/* 숫자 리스트 (1 2 3 ... 10) */}
                    {getPageNumbers().map(num => (
                        <button
                            key={num}
                            onClick={() => setPage(num)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                data?.getAllMembers.currentPage === num
                                    ? "bg-[#19344e] text-white"
                                    : "text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                          {num}
                        </button>
                    ))}

                    {/* 다음 한 칸 (>) */}
                    <button
                        disabled={data?.getAllMembers.isLast}
                        onClick={() => setPage(prev => prev + 1)}
                        className="px-2 py-1 text-gray-400 hover:text-[#19344e] disabled:opacity-30 cursor-pointer ml-2"
                    >
                      &gt;
                    </button>

                    {/* 맨 끝으로 (>>) */}
                    {data?.getAllMembers.isFirst &&
                    <button
                        onClick={() => setPage(data?.getAllMembers.totalPages)}
                        className="px-2 py-1 text-gray-400 hover:text-[#19344e] disabled:opacity-30 cursor-pointer"
                    >
                      &raquo;
                    </button>}
                  </div>
                </div>
                {selectedMember !== initialMember && (
                    <div className="w-[28%] sticky top-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* 상세 컴포넌트 호출 */}
                      <SignupRequestDetailPage
                          member={selectedMember}
                          onClose={() => setSelectedMember(initialMember)} // 닫기 기능 추가용
                      />
                    </div>
                )}
            </div>
        </div>
    );
}
