import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListBoardPosts,
  useGetBoardPost,
  useDeleteBoardPost,
  useCreateBoardComment,
  useUpdateBoardComment,
  useDeleteBoardComment,
  useGenerateBoardAiReply,
  usePinBoardPost,
  useUpdateBoardPostStatus,
  useListBoardNotifications,
  useMarkNotificationSent,
  getListBoardPostsQueryKey,
  getGetBoardPostQueryKey,
  getListBoardNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Pin,
  PinOff,
  MessageSquare,
  Sparkles,
  Trash2,
  Eye,
  Phone,
  CheckCircle2,
  Bell,
  RefreshCw,
  ChevronLeft,
  Send,
  Lock,
  User,
  ShieldCheck,
  Edit2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  inquiry: { label: "문의", color: "bg-blue-100 text-blue-700" },
  notice: { label: "공지", color: "bg-yellow-100 text-yellow-700" },
  general: { label: "자유", color: "bg-gray-100 text-gray-700" },
  complaint: { label: "불만/개선", color: "bg-red-100 text-red-700" },
};

const STATUSES: Record<string, { label: string; color: string }> = {
  open: { label: "대기중", color: "bg-orange-100 text-orange-700" },
  answered: { label: "답변완료", color: "bg-green-100 text-green-700" },
  closed: { label: "종결", color: "bg-gray-100 text-gray-500" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function AuthorBadge({ type }: { type: string }) {
  if (type === "admin") return (
    <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
      <ShieldCheck className="w-3 h-3" /> 관리자
    </span>
  );
  if (type === "partner") return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
      <User className="w-3 h-3" /> 파트너
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
      <User className="w-3 h-3" /> 고객
    </span>
  );
}

function NotificationPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: notifications, isLoading } = useListBoardNotifications(
    { sent: "false" },
    { query: { refetchInterval: 10000 } }
  );
  const markSent = useMarkNotificationSent();

  async function handleMarkSent(id: number) {
    await markSent.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListBoardNotificationsQueryKey({ sent: "false" }) });
    toast({ title: "전송 완료 처리되었습니다" });
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} 복사됨` });
  }

  const count = notifications?.length ?? 0;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-orange-600" />
        <span className="font-semibold text-sm text-orange-800">발송 대기 알림</span>
        {count > 0 && (
          <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">{count}</span>
        )}
      </div>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
      ) : count === 0 ? (
        <p className="text-xs text-orange-400">대기 중인 알림이 없습니다</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notifications!.map((n) => (
            <div key={n.id} className="bg-white rounded-md border border-orange-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <span className="text-xs font-medium">{n.recipientName}</span>
                <button
                  onClick={() => copyToClipboard(n.recipientPhone, "연락처")}
                  className="text-xs text-blue-600 hover:underline ml-1"
                >
                  {n.recipientPhone}
                </button>
              </div>
              <p className="text-xs text-gray-600 whitespace-pre-line bg-gray-50 rounded p-2">
                {n.messageContent}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs flex-1"
                  onClick={() => copyToClipboard(n.messageContent, "메시지")}
                >
                  메시지 복사
                </Button>
                <Button
                  size="sm"
                  className="text-xs flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleMarkSent(n.id)}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  전송 완료
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostDetail({
  postId,
  onBack,
}: {
  postId: number;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [replyText, setReplyText] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [statusChanging, setStatusChanging] = useState(false);

  const { data: post, isLoading } = useGetBoardPost(postId);
  const createComment = useCreateBoardComment();
  const updateComment = useUpdateBoardComment();
  const deleteComment = useDeleteBoardComment();
  const generateAiReply = useGenerateBoardAiReply();
  const pinPost = usePinBoardPost();
  const updateStatus = useUpdateBoardPostStatus();

  async function handleSubmitReply() {
    if (!replyText.trim()) return;
    await createComment.mutateAsync({ postId, data: { content: replyText.trim() } });
    setReplyText("");
    await queryClient.invalidateQueries({ queryKey: getGetBoardPostQueryKey(postId) });
    await queryClient.invalidateQueries({ queryKey: getListBoardPostsQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getListBoardNotificationsQueryKey({ sent: "false" }) });
    toast({ title: "답변이 등록되었습니다" });
  }

  async function handleAiReply() {
    setGeneratingAi(true);
    try {
      const { reply } = await generateAiReply.mutateAsync({ postId });
      setReplyText(reply);
      toast({ title: "AI 답변이 생성되었습니다. 검토 후 등록하세요." });
    } catch {
      toast({ title: "AI 답변 생성 실패", variant: "destructive" });
    } finally {
      setGeneratingAi(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    await deleteComment.mutateAsync({ postId, commentId });
    await queryClient.invalidateQueries({ queryKey: getGetBoardPostQueryKey(postId) });
    toast({ title: "삭제되었습니다" });
  }

  async function handleUpdateComment(commentId: number) {
    if (!editContent.trim()) return;
    await updateComment.mutateAsync({ postId, commentId, data: { content: editContent.trim() } });
    setEditingCommentId(null);
    await queryClient.invalidateQueries({ queryKey: getGetBoardPostQueryKey(postId) });
    toast({ title: "수정되었습니다" });
  }

  async function handlePin() {
    await pinPost.mutateAsync({ postId, data: { isPinned: !post!.isPinned } });
    await queryClient.invalidateQueries({ queryKey: getGetBoardPostQueryKey(postId) });
    await queryClient.invalidateQueries({ queryKey: getListBoardPostsQueryKey() });
    toast({ title: post!.isPinned ? "핀 해제되었습니다" : "고정되었습니다" });
  }

  async function handleStatusChange(status: string) {
    setStatusChanging(true);
    await updateStatus.mutateAsync({ postId, data: { status } });
    await queryClient.invalidateQueries({ queryKey: getGetBoardPostQueryKey(postId) });
    await queryClient.invalidateQueries({ queryKey: getListBoardPostsQueryKey() });
    setStatusChanging(false);
    toast({ title: "상태가 변경되었습니다" });
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!post) return <p className="text-gray-500 py-8 text-center">게시글을 찾을 수 없습니다</p>;

  const catInfo = CATEGORIES[post.category] ?? { label: post.category, color: "bg-gray-100 text-gray-600" };
  const statusInfo = STATUSES[post.status] ?? { label: post.status, color: "bg-gray-100 text-gray-500" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          목록
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-start gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catInfo.color}`}>{catInfo.label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          {post.isPinned && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">📌 고정</span>}
          {post.isSecret && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"><Lock className="w-3 h-3 inline" /> 비밀글</span>}
          <div className="flex gap-1 ml-auto">
            <Button variant="outline" size="sm" onClick={handlePin}>
              {post.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
            {Object.keys(STATUSES).filter(s => s !== post.status).map(s => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                disabled={statusChanging}
                onClick={() => handleStatusChange(s)}
                className="text-xs"
              >
                {STATUSES[s].label}로 변경
              </Button>
            ))}
          </div>
        </div>

        <h2 className="text-lg font-bold">{post.title}</h2>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <AuthorBadge type={post.authorType} />
          <span>{post.authorName}</span>
          {post.contactPhone && (
            <span className="flex items-center gap-1 text-blue-600">
              <Phone className="w-3 h-3" /> {post.contactPhone}
            </span>
          )}
          <span className="ml-auto"><Eye className="w-3 h-3 inline mr-1" />{post.viewCount}</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>

        <div className="border-t pt-3 text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">
          {post.content}
        </div>
      </div>

      {/* Comments */}
      {post.comments && post.comments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">댓글 {post.comments.length}개</p>
          {post.comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-4 space-y-2 ${c.authorType === "admin" ? "bg-purple-50 border-purple-200" : "bg-white"}`}
            >
              <div className="flex items-center gap-2">
                <AuthorBadge type={c.authorType} />
                <span className="text-xs text-gray-500">{c.authorName}</span>
                {c.isAiGenerated && (
                  <span className="text-xs text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">
                    <Sparkles className="w-3 h-3 inline" /> AI 생성
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                <button
                  onClick={() => { setEditingCommentId(c.id); setEditContent(c.content); }}
                  className="text-gray-400 hover:text-blue-500"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDeleteComment(c.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {editingCommentId === c.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateComment(c.id)}>저장</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap text-gray-700">{c.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply box */}
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">관리자 답변</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAiReply}
            disabled={generatingAi}
            className="text-violet-600 border-violet-200 hover:bg-violet-50"
          >
            {generatingAi ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            AI 답변 생성
          </Button>
        </div>
        <Textarea
          placeholder="답변 내용을 입력하세요..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={4}
        />
        <Button
          onClick={handleSubmitReply}
          disabled={!replyText.trim() || createComment.isPending}
          className="w-full"
        >
          {createComment.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          답변 등록
        </Button>
      </div>
    </div>
  );
}

export default function AdminBoard() {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, refetch } = useListBoardPosts(
    {
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      limit: 50,
    },
    { query: { refetchInterval: 30000 } }
  );

  const posts = data?.posts ?? [];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        {selectedPostId !== null ? (
          <PostDetail postId={selectedPostId} onBack={() => setSelectedPostId(null)} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">고객 게시판 관리</h1>
                <p className="text-sm text-gray-500 mt-1">문의·공지·불만 등 게시물을 관리하고 AI 답변으로 빠르게 응대하세요</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <NotificationPanel />

            <div className="flex flex-wrap gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-sm border rounded-md px-2 py-1.5 bg-white"
              >
                <option value="">전체 카테고리</option>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border rounded-md px-2 py-1.5 bg-white"
              >
                <option value="">전체 상태</option>
                {Object.entries(STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">게시글이 없습니다</div>
            ) : (
              <div className="space-y-2">
                {posts.map((p) => {
                  const catInfo = CATEGORIES[p.category] ?? { label: p.category, color: "bg-gray-100 text-gray-600" };
                  const statusInfo = STATUSES[p.status] ?? { label: p.status, color: "bg-gray-100 text-gray-500" };
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPostId(p.id)}
                      className="w-full text-left rounded-lg border bg-white hover:bg-gray-50 p-4 transition-colors"
                    >
                      <div className="flex items-start gap-2 flex-wrap">
                        {p.isPinned && <span className="text-yellow-500">📌</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${catInfo.color}`}>{catInfo.label}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                        <span className="font-medium text-sm flex-1 min-w-0 truncate">{p.title}</span>
                        {p.isSecret && <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <AuthorBadge type={p.authorType} />
                        <span>{p.authorName}</span>
                        <span className="ml-auto flex items-center gap-2">
                          <Eye className="w-3 h-3" />{p.viewCount}
                          <MessageSquare className="w-3 h-3" />{p.commentCount}
                          <span>{formatDate(p.createdAt)}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
