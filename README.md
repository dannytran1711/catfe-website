# CATFE — Website & Studio

Website CATFE, logo và tông màu CATFE, nội dung VI/EN.

Website công khai: https://catfe-paradise.dannywork1711.chatgpt.site

GitHub lưu mã nguồn. Trang công khai dùng Sites để giữ blog, ảnh tải lên và thống kê hoạt động. GitHub Pages trỏ khách về website này.

## Sử dụng

- Website: `/`
- Giải thích sáu màu vòng cổ: `/lan-dau-ghe/#collars`
- Blog: `/chuyen-catfe/`
- Quản lý blog, hành trình và link riêng: `/quan-tri/`

Studio dùng đăng nhập của Sites. Tài khoản chủ sở hữu hiện tại được đối chiếu phía máy chủ qua biến môi trường `CATFE_OWNER_EMAIL`, rồi lưu ID người dùng theo Site. Không có mật khẩu mặc định. Không tự cấp quyền cho người biết URL. Muốn một người khác quản lý cần cấp quyền danh tính và quyền vào Site phù hợp; Studio hiện chỉ dành cho chủ sở hữu; website công khai không cấp quyền quản lý cho khách.

Blog có ảnh bìa, tiêu đề, mô tả, nội dung, danh mục, chi nhánh và VI/EN. Có thể đăng bản VI rồi bổ sung EN; nếu bắt đầu EN thì hoàn thiện đủ trước khi đăng. Lưu nháp không thay bản đang hiển thị. Đăng bài cập nhật nội dung đang hiển thị. Bài lưu trữ giữ trong D1 và rời danh sách làm việc. Ảnh nằm trong R2; ảnh nháp chỉ người quản lý xem được.

Khách chọn cho phép hoặc từ chối thống kê; tùy chọn ở footer. Mở trang, thấy CTA và bấm CTA được ghi riêng. CTA được thấy khi hiện ít nhất 50% trong màn hình; đếm một lần cho mỗi lần mở trang. Không ghi nội dung biểu mẫu, địa chỉ IP, email hoặc query URL. Tên chỉ lấy từ danh tính đăng nhập đã được nền tảng xác nhận. Khách chưa đăng nhập hiện mã trình duyệt, không suy đoán tên. Phiên kết thúc sau 30 phút không hoạt động. Dữ liệu máy khách có thể bị chặn hoặc bỏ sót khi rời trang; số liệu là thống kê trải nghiệm, không phải bằng chứng giao dịch.

Link riêng có nhãn như “Link gửi Bách”; nhãn không chứng minh người mở là Bách. Link không thay đổi quyền xem website. Dashboard mặc định gồm lượt ghé của quản trị viên, có bộ lọc loại các lượt đó. Tỷ lệ CTA = số phiên bấm / số phiên thấy CTA trong bộ lọc. Timeline mở toàn bộ sự kiện trong phiên đã chọn; danh sách phiên được lọc theo sự kiện trong khoảng thời gian/chọn chi nhánh/ngôn ngữ.

## Source

- `scripts/build-catfe.mjs`: trình tạo giao diện hiện tại, nguồn `site/`, đầu ra `site-pages/` và `public/`.
- `server/core.mjs`: bài viết, ảnh, phân quyền, thống kê.
- `db/schema.ts`, `drizzle/`: D1 và các migration bất biến.
- `content/cats.json`: 23 thành viên Tân Phú và 25 thành viên Bình Tân, ảnh và thông tin từ bảng người dùng cung cấp. Estella giữ Coming soon.
- `scripts/members.mjs`, `site/members.css`: thẻ thành viên và hồ sơ riêng; giữ nguyên CTA chọn nhà hiện có.
- `content/events.json`, `content/partners.json`: chưa có dữ liệu, ẩn khỏi trang chủ.

`npm run build` tạo trang và bundle Vinext. Hạ tầng Sites cấp `DB` và `BUCKET`; giữ `project_id` trong `.openai/hosting.json`. Các biến môi trường được lưu trong Sites, không đưa vào source. Không dùng `dist/` làm mã nguồn sau khi nâng cấp server.

Kiểm tra luồng backend: `node --test tests/workflows.test.mjs`. Kiểm tra kiểu: `node node_modules/typescript/bin/tsc --noEmit`. Browser QA chưa thực hiện trong môi trường hiện tại.
