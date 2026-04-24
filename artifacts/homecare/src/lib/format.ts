export const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString("ko-KR")}원`;
};

export const translateOrderStatus = (status: string) => {
  const map: Record<string, string> = {
    requested: "접수됨",
    paid: "결제완료",
    pending_assignment: "배정대기",
    assigned: "배정완료",
    en_route: "이동중",
    arrived: "도착",
    in_progress: "작업중",
    inspection_pending: "검수대기",
    inspection_approved: "검수완료",
    completed: "완료",
    cancelled: "취소",
    as_requested: "A/S접수",
  };
  return map[status] || status;
};

export const translateJobAssignmentStatus = (status: string) => {
  const map: Record<string, string> = {
    pending: "대기중",
    accepted: "수락됨",
    rejected: "거절됨",
    cancelled: "취소됨",
    completed: "완료됨",
  };
  return map[status] || status;
};

export const translatePartnerApprovalStatus = (status: string) => {
  const map: Record<string, string> = {
    pending: "승인대기",
    approved: "승인됨",
    rejected: "거절됨",
    suspended: "정지됨",
  };
  return map[status] || status;
};

export const translateAsRequestStatus = (status: string) => {
  const map: Record<string, string> = {
    pending: "대기중",
    assigned: "배정됨",
    in_progress: "진행중",
    completed: "완료됨",
    rejected: "반려됨",
  };
  return map[status] || status;
};

export const getOrderStatusColor = (status: string) => {
  const map: Record<string, string> = {
    requested: "bg-gray-100 text-gray-800",
    paid: "bg-blue-100 text-blue-800",
    pending_assignment: "bg-yellow-100 text-yellow-800",
    assigned: "bg-indigo-100 text-indigo-800",
    en_route: "bg-purple-100 text-purple-800",
    arrived: "bg-fuchsia-100 text-fuchsia-800",
    in_progress: "bg-orange-100 text-orange-800",
    inspection_pending: "bg-teal-100 text-teal-800",
    inspection_approved: "bg-cyan-100 text-cyan-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    as_requested: "bg-pink-100 text-pink-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
};
