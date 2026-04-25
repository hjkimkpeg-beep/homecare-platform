import { useState } from "react";
import { CustomerLayout } from "@/components/layout/customer-layout";
import {
  useListBoardPosts,
  useGetBoardPost,
  useCreateBoardPost,
  useUpdateBoardPost,
  useDeleteBoardPost,
  useCreateBoardComment,
  useDeleteBoardComment,
  getListBoardPostsQueryKey,
  getGetBoardPostQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Loader2,
  MessageSquare,
  Eye,
  Lock,
  ChevronLeft,
  PlusCircle,
  Send,
  Trash2,
  ShieldCheck,
  User,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  inquiry: { label: "문의", color: "bg-blue-100 text-blue-700" },
  notice: { label: "공지", color: "bg-yellow-100 text-yellow-700" },
  general: { label: "자유", color: "bg-gray-100 text-gray-700" },
  complaint: { label: "불만/개선", color: "bg-red-100 text-red-700" },
};

const STATUSES: Record<string, { label: string; color: string }> = {
  open: { label: "대기중", color: "text-orange-500" },
  answered: { label: "답변완료", color: "text-green-600" },
  closed: { label: "종결", color: "text-gray-400" },
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
  return (
    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
      <User className="w-3 h-3" /> 고객
    </span>
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");

  const { data: post, isLoading } = useGetBoardPost(postId);
  const createComment = useCreateBoardComment();
  const deleteComment = useDeleteBoardComment();
  const deletePost = useDeleteBoardPost();

  async function handleSubmitComment() {
    if (!commentText.trim()) return;
    await createComment.mutateAsync({ postId, data: { content: commentText.trim() } });
    setCommentText("");
    await queryClient.invalidateQueries({ queryKey: getGetBoardPostQueryKey(postId) });
    toast({ title: "댓글이 등록되었습니다" });
  }

  async function handleDeleteComment(commentId: number) {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    await deleteComment.mutateAsync({ postId, commentId });
    await queryClient.invalidateQueries({ queryKey: getGetBoardPostQueryKey(postId) });
    toast({ title: "삭제되었습니다" });
  }

  async function handleDeletePost() {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    await deletePost.mutateAsync({ postId });
    await queryClient.invalidateQueries({ queryKey: getListBoardPostsQueryKey() });
    onBack();
    toast({ title: "삭제되었습니다" });
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!post) return <p className="text-center text-gray-400 py-8">게시글을 찾을 수 없습니다</p>;

  const catInfo = CATEGORIES[post.category] ?? { label: post.category, color: "bg-gray-100 text-gray-600" };
  const statusInfo = STATUSES[post.status] ?? { label: post.status, color: "text-gray-500" };
  const isMyPost = post.userId === user?.id;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          목록
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catInfo.color}`}>{catInfo.label}</span>
          <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          {post.isPinned && <span className="text-xs text-yellow-600">📌 공지</span>}
          {post.isSecret && <span className="text-xs text-gray-500"><Lock className="w-3 h-3 inline" /> 비밀글</span>}
          {isMyPost && (
            <Button variant="ghost" size="sm" className="ml-auto text-red-400 hover:text-red-600" onClick={handleDeletePost}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        <h2 className="text-lg font-bold">{post.title}</h2>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <AuthorBadge type={post.authorType} />
          <span>{post.authorName}</span>
          <span className="ml-auto flex items-center gap-2">
            <Eye className="w-3 h-3" />{post.viewCount}
            <span>{formatDate(post.createdAt)}</span>
          </span>
        </div>
        <div className="border-t pt-3 text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">
          {post.content}
        </div>
      </div>

      {post.comments && post.comments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">댓글 {post.comments.length}개</p>
          {post.comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-4 ${c.authorType === "admin" ? "bg-purple-50 border-purple-200" : "bg-white"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <AuthorBadge type={c.authorType} />
                <span className="text-xs text-gray-500">{c.authorName}</span>
                {c.isAiGenerated && (
                  <span className="text-xs text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI 답변
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                {c.userId === user?.id && (
                  <button onClick={() => handleDeleteComment(c.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap text-gray-700">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 space-y-2">
        <Textarea
          placeholder="댓글을 입력하세요..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
        />
        <Button
          onClick={handleSubmitComment}
          disabled={!commentText.trim() || createComment.isPending}
          size="sm"
          className="w-full"
        >
          {createComment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
          댓글 등록
        </Button>
      </div>
    </div>
  );
}

function NewPostForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("inquiry");
  const [isSecret, setIsSecret] = useState(false);
  const createPost = useCreateBoardPost();

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      toast({ title: "제목과 내용을 입력해주세요", variant: "destructive" });
      return;
    }
    await createPost.mutateAsync({ data: { title: title.trim(), content: content.trim(), category, isSecret } });
    onCreated();
    onClose();
    toast({ title: "게시글이 등록되었습니다" });
  }

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">새 글 작성</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full text-sm border rounded-md px-3 py-2"
      >
        {Object.entries(CATEGORIES).filter(([k]) => k !== "notice").map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      <Input
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="내용을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
      />

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={isSecret}
          onChange={(e) => setIsSecret(e.target.checked)}
          className="rounded"
        />
        <Lock className="w-3.5 h-3.5 text-gray-500" />
        비밀글
      </label>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={createPost.isPending}>
          {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          등록
        </Button>
      </div>
    </div>
  );
}

export default function CustomerBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data, isLoading } = useListBoardPosts(
    { ...(categoryFilter ? { category: categoryFilter } : {}), limit: 50 },
    { query: { refetchInterval: 30000 } }
  );

  const posts = data?.posts ?? [];

  function handleCreated() {
    queryClient.invalidateQueries({ queryKey: getListBoardPostsQueryKey() });
  }

  if (selectedPostId !== null) {
    return (
      <CustomerLayout>
        <div className="p-4 max-w-2xl mx-auto">
          <PostDetail postId={selectedPostId} onBack={() => setSelectedPostId(null)} />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">고객 게시판</h1>
            <p className="text-sm text-gray-500">문의, 건의사항을 남겨주세요</p>
          </div>
          {user && !showNewForm && (
            <Button size="sm" onClick={() => setShowNewForm(true)}>
              <PlusCircle className="w-4 h-4 mr-1" />
              글쓰기
            </Button>
          )}
        </div>

        {showNewForm && (
          <NewPostForm onClose={() => setShowNewForm(false)} onCreated={handleCreated} />
        )}

        <div className="flex gap-2 flex-wrap">
          {[{ value: "", label: "전체" }, ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label }))].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategoryFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                categoryFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">게시글이 없습니다</p>
            {user && (
              <Button size="sm" className="mt-3" onClick={() => setShowNewForm(true)}>
                첫 글 작성하기
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => {
              const catInfo = CATEGORIES[p.category] ?? { label: p.category, color: "bg-gray-100 text-gray-600" };
              const statusInfo = STATUSES[p.status] ?? { label: p.status, color: "text-gray-500" };
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPostId(p.id)}
                  className="w-full text-left rounded-lg border bg-white hover:bg-gray-50 p-4 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.isPinned && <span className="text-yellow-500 text-sm">📌</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${catInfo.color}`}>{catInfo.label}</span>
                    {p.isSecret && <Lock className="w-3 h-3 text-gray-400" />}
                    <span className="font-medium text-sm flex-1 min-w-0 truncate">{p.title}</span>
                    <span className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
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
      </div>
    </CustomerLayout>
  );
}
