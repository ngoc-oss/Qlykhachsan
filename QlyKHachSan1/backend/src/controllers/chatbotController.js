const chatbotService = require("../services/chatbotService");

class ChatbotController {
    async hoiDap(req, res, next) {
        try {
            const { tinNhan = "" } = req.body || {};
            const phanHoi = await chatbotService.hoiDap(tinNhan);

            res.json({
                thanhCong: true,
                duLieu: phanHoi,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChatbotController();