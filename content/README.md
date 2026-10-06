# Nội dung CATFE

Thành viên: Tân Phú có 23 hồ sơ, Bình Tân có 25 hồ sơ từ bảng người dùng gửi ngày 06/10/2026. Estella, lịch sự kiện và đối tác đang để trống có chủ đích. Không tạo hồ sơ mèo hoặc đối tác giả. Khi chưa có thành viên, mỗi trang `/[chi-nhanh]/cats/` hiển thị Coming soon. Trang chủ tự ẩn Events và Partners khi chưa có dữ liệu.

Chạy `node scripts/build-catfe.mjs` để cập nhật toàn bộ HTML và bản dịch sau khi sửa nội dung.

## Thành viên — cats.json

Mỗi chi nhánh có một mảng riêng: `tan-phu`, `binh-tan`, `estella`. Mỗi mục gồm `slug`, `name`, `image` (đường dẫn tương đối trong `site/assets/`), `group`, `breed`, `personality`, `imageAlt`. Các trường văn bản gồm `{ "vi": "...", "en": "..." }`. `sex`, `birthYear`, `ageOnRoster` chỉ dùng khi bảng cung cấp; không suy đoán tuổi hay giới tính còn thiếu. `ageOnRoster` là tuổi in trên bảng, không tự cập nhật theo năm hiện tại.

Ảnh chân dung được tách nguyên bản từ bảng thành viên; không tạo mèo hoặc hình ảnh thay thế. Ảnh nhỏ được hiển thị trong khung tròn vừa phải. Trình tạo tạo `/[chi-nhanh]/cats/` và `/[chi-nhanh]/cats/[slug]/`. Không cần trường `story`: hồ sơ hiển thị tính cách được cung cấp, không tự sáng tác tiểu sử. Estella tiếp tục Coming soon cho tới khi có bảng riêng.

## Sự kiện — events.json

Mỗi mục gồm `title`, `description`, `dateLabel` (đối tượng vi/en), `image` và `url` dẫn đến thông tin đã công bố. Chỉ thêm lịch đã xác nhận.

## Đối tác — partners.json

Mỗi mục gồm `name`, `role`, `description` (đối tượng vi/en), `image` và `url`. Chỉ dùng quan hệ hợp tác đã xác nhận.
