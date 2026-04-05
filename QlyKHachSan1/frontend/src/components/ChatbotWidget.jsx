import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { chatbotApi } from "../services/api";

function ChatbotWidget() {
    const location = useLocation();
    const navigate = useNavigate();
    const [dangMo, setDangMo] = useState(false);
    const [dangGui, setDangGui] = useState(false);
    const [tinNhanNhap, setTinNhanNhap] = useState("");
    const [goiYCuoi, setGoiYCuoi] = useState([
        "Giá phòng hiện tại",
        "Khách sạn còn phòng trống không?",
        "Hướng dẫn đặt phòng",
    ]);
    const [lichSu, setLichSu] = useState([
        {
            vaiTro: "bot",
            noiDung:
                "Xin chào 👋 Mình là trợ lý LumiStay. Mình có thể tư vấn giá phòng, phòng trống và cách đặt phòng.",
        },
    ]);

    const laTrangAdmin = useMemo(
        () => location.pathname.startsWith("/admin"),
        [location.pathname],
    );

    if (laTrangAdmin) {
        return null;
    }

    const guiTinNhan = async (noiDungRaw) => {
        const noiDung = noiDungRaw.trim();
        if (!noiDung || dangGui) return;

        setTinNhanNhap("");
        setLichSu((cu) => [...cu, { vaiTro: "user", noiDung }]);
        setDangGui(true);

        try {
            const { data } = await chatbotApi.hoiDap(noiDung);
            const phanHoi = data?.duLieu || {};
            const traLoi =
                phanHoi.traLoi || "Mình chưa hiểu rõ, bạn có thể hỏi ngắn gọn hơn nhé.";
            const goiY = Array.isArray(phanHoi.goiY) ? phanHoi.goiY : [];
            const hanhDong = phanHoi.hanhDong || null;

            setLichSu((cu) => [...cu, { vaiTro: "bot", noiDung: traLoi, hanhDong }]);
            setGoiYCuoi(goiY);
        } catch {
            setLichSu((cu) => [
                ...cu,
                {
                    vaiTro: "bot",
                    noiDung:
                        "Mình đang hơi bận, bạn thử lại sau ít giây nhé. Hoặc bạn có thể vào thẳng trang /phong để đặt phòng.",
                    hanhDong: {
                        loai: "dieu_huong",
                        duongDan: "/phong",
                        nhan: "Mở trang phòng",
                    },
                },
            ]);
        } finally {
            setDangGui(false);
        }
    };

    const xuLySubmit = async (e) => {
        e.preventDefault();
        await guiTinNhan(tinNhanNhap);
    };

    const moDieuHuong = (duongDan) => {
        navigate(duongDan);
        setDangMo(false);
    };

    return (
        <div className="fixed bottom-5 right-5 z-[60]">
            {dangMo && (
                <div className="mb-3 w-[350px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-white">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            <div>
                                <p className="m-0 text-sm font-semibold">LumiStay Assistant</p>
                                <p className="m-0 text-xs text-blue-100">Hỗ trợ đặt phòng nhanh</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDangMo(false)}
                            className="rounded-md p-1 text-white/90 hover:bg-white/10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="max-h-[360px] space-y-3 overflow-y-auto bg-slate-50 p-3">
                        {lichSu.map((tin, idx) => (
                            <div
                                key={`${tin.vaiTro}-${idx}`}
                                className={`flex ${tin.vaiTro === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${tin.vaiTro === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-slate-700 border border-slate-200"
                                        }`}
                                >
                                    {tin.noiDung}

                                    {tin.hanhDong?.loai === "dieu_huong" && tin.hanhDong?.duongDan && (
                                        <button
                                            onClick={() => moDieuHuong(tin.hanhDong.duongDan)}
                                            className="mt-2 block rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                        >
                                            {tin.hanhDong.nhan || "Mở"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {dangGui && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                                    Đang trả lời...
                                </div>
                            </div>
                        )}
                    </div>

                    {goiYCuoi.length > 0 && (
                        <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white px-3 py-2">
                            {goiYCuoi.slice(0, 3).map((goiY) => (
                                <button
                                    key={goiY}
                                    onClick={() => guiTinNhan(goiY)}
                                    className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                                >
                                    {goiY}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={xuLySubmit} className="flex gap-2 border-t border-slate-200 bg-white p-3">
                        <input
                            value={tinNhanNhap}
                            onChange={(e) => setTinNhanNhap(e.target.value)}
                            placeholder="Nhập câu hỏi..."
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={dangGui || !tinNhanNhap.trim()}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setDangMo((cu) => !cu)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:scale-105 hover:bg-blue-700"
                aria-label="Mở chatbot"
            >
                {dangMo ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>
        </div>
    );
}

export default ChatbotWidget;