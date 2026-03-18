# كيفية إضافة مقال جديد

## الخطوة 1: أنشئ ملف HTML في مجلد `posts/`
انسخ أي ملف موجود مثل `posts/welcome.html` وأعد تسميته.

## الخطوة 2: أضف المقال في `assets/posts.js`
```js
{
  slug: "my-new-post",       // اسم ملف HTML بدون .html
  title: "عنوان المقال",
  excerpt: "ملخص قصير...",
  date: "2026-03-20",        // YYYY-MM-DD
  author: "اسمك",
  tags: ["تقنية", "PHP"],
  readTime: 5,               // وقت القراءة بالدقائق
  emoji: "🚀"               // إيموجي يمثل المقال
}
```

## الخطوة 3: ارفع على GitHub
```bash
git add .
git commit -m "add: مقال جديد"
git push
```
