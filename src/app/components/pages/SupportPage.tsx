import { Phone, MessageCircle, ArrowRight, Headphones, Mail } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

export default function SupportPage() {
  const phoneNumber = '01556221178';
  const whatsappNumber = '01097333399';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-2xl">
        {/* Back to Login */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6 font-medium"
        >
          <ArrowRight className="w-5 h-5" />
          العودة لتسجيل الدخول
        </Link>

        <Card className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4">
              <Headphones className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              الدعم الفني
            </h1>
            <p className="text-gray-600">
              نحن هنا لمساعدتك في أي وقت
            </p>
          </div>

          {/* Support Options */}
          <div className="space-y-4 mb-8">
            {/* Phone Contact */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-pink-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    اتصل بالمهندس روماني
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    للدعم الفني الفوري والمساعدة في حل أي مشكلة
                  </p>
                  <a
                    href={`tel:${phoneNumber}`}
                    className="inline-flex items-center gap-2"
                  >
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                      <Phone className="w-4 h-4 ml-2" />
                      {phoneNumber}
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* WhatsApp Contact */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    تواصل عبر الواتساب
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    راسلنا على الواتساب وسنرد عليك في أسرع وقت
                  </p>
                  <a
                    href={`https://wa.me/2${whatsappNumber}?text=مرحباً، أحتاج مساعدة في نظام Hi Salon`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                      <MessageCircle className="w-4 h-4 ml-2" />
                      {whatsappNumber}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <Mail className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900 mb-2">ساعات العمل</h4>
            <p className="text-gray-600 text-sm">
              نحن متاحون للرد على استفساراتكم من السبت إلى الخميس
            </p>
            <p className="text-gray-600 text-sm">
              من الساعة 9 صباحاً حتى 6 مساءً
            </p>
          </div>

          {/* Common Issues */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3 text-center">
              المشاكل الشائعة
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-pink-500">•</span>
                <span>نسيت كلمة المرور - اتصل بالدعم الفني لإعادة تعيينها</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-pink-500">•</span>
                <span>مشكلة في تسجيل الدخول - تأكد من اسم المستخدم وكلمة المرور</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-pink-500">•</span>
                <span>بيانات خاطئة - راجع إدخال البيانات بشكل صحيح</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>نظام Hi Salon - إدارة مراكز التجميل</p>
          <p className="mt-1">جميع الحقوق محفوظة © 2026</p>
        </div>
      </div>
    </div>
  );
}
