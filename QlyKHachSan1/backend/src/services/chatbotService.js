const { LoaiPhong, Phong, DichVu } = require("../models");

class ChatbotService {
    boDauVaVietThuong(chuoi = "") {
        return chuoi
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "d")
            .toLowerCase()
            .trim();
    }

    taoPhanHoiMacDinh() {
        return {
            traLoi:
                "Mình có thể hỗ trợ bạn về giá phòng, phòng trống, dịch vụ và hướng dẫn đặt phòng. Bạn muốn hỏi phần nào trước?",
            goiY: [
                "Giá phòng hiện tại là bao nhiêu?",
                "Khách sạn còn phòng trống không?",
                "Khách sạn có những dịch vụ gì?",
            ],
        };
    }

    async taoPhanHoiGiaPhong() {
        try {
            const cacLoaiPhong = await LoaiPhong.findAll({
                where: { trangThai: "hoatdong" },
                attributes: ["tenLoaiPhong", "giaHienTai"],
                order: [["giaHienTai", "ASC"]],
                limit: 4,
            });

            if (!cacLoaiPhong.length) {
                return {
                    traLoi:
                        "Hiện tại mình chưa lấy được bảng giá mới nhất. Bạn có thể vào trang Phòng để xem chi tiết nhé.",
                    hanhDong: {
                        loai: "dieu_huong",
                        duongDan: "/phong",
                        nhan: "Xem danh sách phòng",
                    },
                };
            }

            const bangGia = cacLoaiPhong
                .map(
                    (item) =>
                        `• ${item.tenLoaiPhong}: ${Number(item.giaHienTai).toLocaleString("vi-VN")}đ/đêm`,
                )
                .join("\n");

            return {
                traLoi: `Mức giá tham khảo hiện tại:\n${bangGia}`,
                goiY: ["Khách sạn còn phòng trống không?", "Tôi muốn đặt phòng ngay"],
            };
        } catch (error) {
            return {
                traLoi:
                    "Hiện tại hệ thống giá đang bận, bạn vui lòng xem trực tiếp tại trang Phòng để có thông tin chính xác nhất.",
                hanhDong: {
                    loai: "dieu_huong",
                    duongDan: "/phong",
                    nhan: "Xem phòng",
                },
            };
        }
    }

    async taoPhanHoiPhongTrong() {
        try {
            const soPhongTrong = await Phong.count({ where: { trangThai: "trong" } });

            if (soPhongTrong <= 0) {
                return {
                    traLoi:
                        "Hiện tại tạm hết phòng trống ngay lúc này. Bạn vẫn có thể để lại yêu cầu để lễ tân hỗ trợ sớm nhất.",
                    goiY: ["Hướng dẫn tôi cách đặt phòng", "Cho tôi xem loại phòng"],
                    hanhDong: {
                        loai: "dieu_huong",
                        duongDan: "/phong",
                        nhan: "Xem phòng",
                    },
                };
            }

            return {
                traLoi: `Hiện tại còn khoảng ${soPhongTrong} phòng ở trạng thái sẵn sàng. Bạn có thể vào trang Phòng để chọn nhanh theo ngày nhận/trả phòng.`,
                goiY: ["Xem danh sách phòng", "Tôi cần tư vấn loại phòng"],
                hanhDong: {
                    loai: "dieu_huong",
                    duongDan: "/phong",
                    nhan: "Đặt phòng ngay",
                },
            };
        } catch (error) {
            return {
                traLoi:
                    "Mình chưa kiểm tra được số phòng trống theo thời gian thực. Bạn vào trang Phòng để hệ thống lọc chính xác theo ngày nhé.",
                hanhDong: {
                    loai: "dieu_huong",
                    duongDan: "/phong",
                    nhan: "Đi đến trang phòng",
                },
            };
        }
    }

    async taoPhanHoiDichVu() {
        try {
            const cacDichVu = await DichVu.findAll({
                where: { trangThai: "hoatdong" },
                attributes: ["tenDichVu", "donGia", "donVi"],
                order: [["id", "DESC"]],
                limit: 5,
            });

            if (!cacDichVu.length) {
                return {
                    traLoi:
                        "Khách sạn có nhiều dịch vụ đi kèm (ăn uống, giặt ủi, spa...). Hiện chưa tải được danh sách chi tiết.",
                };
            }

            const danhSach = cacDichVu
                .map(
                    (item) =>
                        `• ${item.tenDichVu}: ${Number(item.donGia).toLocaleString("vi-VN")}đ/${item.donVi || "dịch vụ"}`,
                )
                .join("\n");

            return {
                traLoi: `Một số dịch vụ nổi bật:\n${danhSach}`,
                goiY: ["Giá phòng hiện tại", "Hướng dẫn đặt phòng"],
            };
        } catch (error) {
            return {
                traLoi:
                    "Khách sạn có các dịch vụ phổ biến như ăn uống, giặt ủi và spa. Bạn có thể hỏi lễ tân khi check-in để được báo giá chi tiết.",
            };
        }
    }

    taoPhanHoiDatPhong() {
        return {
            traLoi:
                "Bạn vào mục Phòng, chọn ngày nhận/trả và nhấn Chọn phòng để gửi yêu cầu đặt. Sau đó lễ tân sẽ xác nhận nhanh cho bạn.",
            goiY: ["Mở trang đặt phòng", "Giá phòng hiện tại"],
            hanhDong: {
                loai: "dieu_huong",
                duongDan: "/phong",
                nhan: "Mở trang đặt phòng",
            },
        };
    }

    async hoiDap(tinNhan = "") {
        const noiDung = this.boDauVaVietThuong(tinNhan);

        if (!noiDung) {
            return this.taoPhanHoiMacDinh();
        }

        const laChaoHoi =
            noiDung.includes("xin chao") ||
            noiDung.includes("hello") ||
            noiDung.includes("hi") ||
            noiDung.includes("chao ban");

        if (laChaoHoi) {
            return {
                traLoi:
                    "Xin chào bạn 👋 Mình là trợ lý LumiStay. Mình có thể hỗ trợ báo giá phòng, kiểm tra phòng trống và hướng dẫn đặt phòng.",
                goiY: [
                    "Giá phòng hiện tại",
                    "Khách sạn còn phòng trống không?",
                    "Hướng dẫn đặt phòng",
                ],
            };
        }

        const hoiGia =
            noiDung.includes("gia") ||
            noiDung.includes("bao nhieu") ||
            noiDung.includes("chi phi");
        if (hoiGia && noiDung.includes("phong")) {
            return this.taoPhanHoiGiaPhong();
        }

        const hoiPhongTrong =
            noiDung.includes("con phong") ||
            noiDung.includes("phong trong") ||
            noiDung.includes("co san") ||
            (noiDung.includes("trong") && noiDung.includes("phong"));
        if (hoiPhongTrong) {
            return this.taoPhanHoiPhongTrong();
        }

        const hoiDichVu =
            noiDung.includes("dich vu") ||
            noiDung.includes("tien nghi") ||
            noiDung.includes("spa") ||
            noiDung.includes("giat");
        if (hoiDichVu) {
            return this.taoPhanHoiDichVu();
        }

        const hoiDatPhong =
            noiDung.includes("dat phong") ||
            noiDung.includes("book") ||
            noiDung.includes("huong dan");
        if (hoiDatPhong) {
            return this.taoPhanHoiDatPhong();
        }

        return this.taoPhanHoiMacDinh();
    }
}

module.exports = new ChatbotService();