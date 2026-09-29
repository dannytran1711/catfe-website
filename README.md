# CATFE — Thiên đường mèo

Website giới thiệu CATFE với hai ngôn ngữ Việt/Anh, ảnh thật, logo CATFE và bảng màu cam–vàng–nâu.

## Chức năng

- Chuyển toàn bộ nội dung giữa tiếng Việt và tiếng Anh; ghi nhớ lựa chọn trên thiết bị.
- Chọn chi nhánh, xem giá vé, đường đi và liên hệ qua Facebook/Zalo.
- Xem ảnh lớn, gặp các thành viên mèo và tìm hiểu màu vòng cổ.
- Giao diện thích ứng với kích thước màn hình; có tùy chọn dừng chuyển động.

## Chạy trên máy

Không cần cài thêm thư viện hay biên dịch. Trong thư mục dự án, chạy:

```sh
python3 -m http.server 8000
```

Mở http://localhost:8000 trong trình duyệt.

## Cấu trúc

- `index.html`: nội dung và cấu trúc trang.
- `style.css`: giao diện, màu sắc, bố cục và chuyển động.
- `app.js`: bản dịch và các tương tác.
- `assets/`: logo, ảnh và phông chữ.
- `CONTENT_SOURCES.md`: nguồn nội dung và hình ảnh.

Các liên kết tài nguyên dùng đường dẫn tương đối để có thể chạy ở thư mục gốc hoặc thư mục con. Tệp `.nojekyll` đã được chuẩn bị nếu triển khai bản tĩnh qua GitHub Pages sau này.

## Nội dung và quyền sử dụng

Ảnh và logo thuộc các chủ sở hữu tương ứng. Đây là mã nguồn bản thiết kế CATFE dành cho việc xem và chỉnh sửa. Cần xác nhận quyền sử dụng hình ảnh cùng giá, giờ và chính sách hiện hành trước khi phát hành công khai. Website chuyển khách sang kênh liên hệ CATFE; không tự ghi nhận đặt chỗ hoặc thanh toán.

Facebook đã được xác nhận: https://www.facebook.com/catfevn/
