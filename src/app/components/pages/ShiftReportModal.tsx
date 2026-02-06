import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useApp } from '@/app/context/AppContext';

interface ShiftReportModalProps {
  shift: any;
  onClose: () => void;
}

export default function ShiftReportModal({ shift, onClose }: ShiftReportModalProps) {
  const { systemSettings, sales, expenses } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  // Get sales for this shift
  const shiftSales = sales.filter(sale => sale.shiftId === shift.id);

  // Calculate stats
  const servicesSales = shiftSales
    .filter(sale => !sale.items || sale.items.length === 0)
    .reduce((sum, sale) => sum + sale.amount, 0);

  const productsSales = shiftSales
    .filter(sale => sale.items && sale.items.length > 0)
    .reduce((sum, sale) => sum + sale.amount, 0);

  const totalSales = servicesSales + productsSales;

  const discounts = shiftSales.reduce((sum, sale) => {
    if (sale.discount && sale.subtotal) {
      return sum + (sale.subtotal - sale.amount);
    }
    return sum;
  }, 0);

  const returns = 0; // Can be calculated if you have returns data

  const netSales = totalSales - discounts - returns;

  // Payment methods
  const cashPayments = shiftSales
    .filter(sale => sale.paymentMethod === 'نقدي')
    .reduce((sum, sale) => sum + sale.amount, 0);

  const cardPayments = shiftSales
    .filter(sale => sale.paymentMethod === 'بطاقة')
    .reduce((sum, sale) => sum + sale.amount, 0);

  const instaPayPayments = shiftSales
    .filter(sale => sale.paymentMethod === 'InstaPay')
    .reduce((sum, sale) => sum + sale.amount, 0);

  // Shift expenses (cash only)
  const shiftExpenses = expenses
    .filter(exp => exp.shiftId === shift.id && exp.paymentMethod === 'نقدي')
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Cash reconciliation
  const openingBalance = shift.openingBalance || 0;
  const expectedCash = openingBalance + cashPayments - shiftExpenses;
  const actualCash = shift.finalCash || 0;
  const cashDifference = actualCash - expectedCash;

  const handlePrintReport = () => {
    const originalTitle = document.title;
    document.title = `Shift Report - ${new Date(shift.startTime).toLocaleDateString('en-US')} - ${shift.cashier}`;
    
    setTimeout(() => {
      window.print();
      
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    }, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-4xl p-6 m-4 dark:bg-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div ref={printRef}>
          <div className="report-container" style={{
            maxWidth: '800px',
            margin: '0 auto',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            padding: '40px',
            background: 'white',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header - Logo and Title */}
            <div className="header" style={{
              textAlign: 'center',
              marginBottom: '35px',
              borderBottom: '3px solid #e91e63',
              paddingBottom: '25px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  H
                </div>
                <div>
                  <h1 style={{
                    margin: 0,
                    color: '#e91e63',
                    fontSize: '42px',
                    fontWeight: 'bold',
                    letterSpacing: '1px'
                  }}>
                    Hi Salon
                  </h1>
                  <p style={{
                    margin: '5px 0 0 0',
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {systemSettings.businessName}
                  </p>
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%)',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '15px'
              }}>
                <h2 style={{
                  margin: '0 0 8px 0',
                  color: '#831843',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}>
                  📊 Shift Closing Report
                </h2>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '25px',
                  flexWrap: 'wrap',
                  marginTop: '10px'
                }}>
                  <div style={{
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    📅 {new Date(shift.startTime).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    🕐 {formatTime(shift.startTime)} - {shift.endTime ? formatTime(shift.endTime) : 'مفتوحة'}
                  </div>
                  <div style={{
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    👤 {shift.cashier}
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Summary Section */}
            <div className="section" style={{
              marginBottom: '25px',
              padding: '20px',
              background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
              borderRadius: '8px',
              border: '2px solid #86efac'
            }}>
              <h2 style={{
                margin: '0 0 15px 0',
                color: '#166534',
                fontSize: '20px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  background: '#22c55e',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>📈</span>
                Sales Summary
              </h2>
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '15px'
                }}>
                  <span style={{ color: '#6b7280' }}>Total Transactions:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{shiftSales.length}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '15px'
                }}>
                  <span style={{ color: '#6b7280' }}>Services Sales:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{servicesSales.toFixed(2)} EGP</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '15px'
                }}>
                  <span style={{ color: '#6b7280' }}>Products Sales:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{productsSales.toFixed(2)} EGP</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '15px'
                }}>
                  <span style={{ color: '#6b7280' }}>Total Sales:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{totalSales.toFixed(2)} EGP</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '15px'
                }}>
                  <span style={{ color: '#dc2626' }}>Discounts:</span>
                  <span style={{ fontWeight: '600', color: '#dc2626' }}>-{discounts.toFixed(2)} EGP</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '2px solid #22c55e',
                  fontSize: '15px'
                }}>
                  <span style={{ color: '#dc2626' }}>Returns:</span>
                  <span style={{ fontWeight: '600', color: '#dc2626' }}>-{returns.toFixed(2)} EGP</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '15px 0 0 0',
                  fontSize: '18px'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#166534' }}>Net Sales:</span>
                  <span style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '20px' }}>{netSales.toFixed(2)} EGP</span>
                </div>
              </div>
            </div>

            {/* Payment Methods Section */}
            <div className="section" style={{
              marginBottom: '25px',
              padding: '20px',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              borderRadius: '8px',
              border: '2px solid #93c5fd'
            }}>
              <h2 style={{
                margin: '0 0 15px 0',
                color: '#1e40af',
                fontSize: '20px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>💳</span>
                Payment Methods
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '15px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px solid #dcfce7',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>💵</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px', fontWeight: '500' }}>Cash</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>{cashPayments.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>EGP</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px solid #dbeafe',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>💳</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px', fontWeight: '500' }}>Card</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>{cardPayments.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>EGP</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '2px solid #fef3c7',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📱</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px', fontWeight: '500' }}>InstaPay</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706' }}>{instaPayPayments.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>EGP</div>
                </div>
              </div>
            </div>

            {/* Cash Reconciliation Section - Only for closed shifts */}
            {shift.status === 'closed' && (
              <div className="section" style={{
                marginBottom: '25px',
                padding: '20px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '8px',
                border: '2px solid #fbbf24'
              }}>
                <h2 style={{
                  margin: '0 0 15px 0',
                  color: '#92400e',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{
                    background: '#f59e0b',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>💰</span>
                  Cash Reconciliation
                </h2>
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Opening Balance:</span>
                    <span style={{ fontWeight: '600', color: '#3b82f6' }}>{openingBalance.toFixed(2)} EGP</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Cash Sales:</span>
                    <span style={{ fontWeight: '600', color: '#16a34a' }}>+{cashPayments.toFixed(2)} EGP</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '2px solid #f59e0b',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Cash Expenses:</span>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>-{shiftExpenses.toFixed(2)} EGP</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '15px 0',
                    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                    margin: '10px -15px',
                    paddingLeft: '15px',
                    paddingRight: '15px',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#6b21a8' }}>Expected Cash in Drawer:</span>
                    <span style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: '18px' }}>{expectedCash.toFixed(2)} EGP</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '2px solid #333',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Actual Cash Counted:</span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{actualCash.toFixed(2)} EGP</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '15px',
                    marginTop: '10px',
                    background: cashDifference > 0 ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : cashDifference < 0 ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderRadius: '8px',
                    border: cashDifference > 0 ? '2px solid #22c55e' : cashDifference < 0 ? '2px solid #ef4444' : '2px solid #9ca3af',
                    fontSize: '18px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#111827' }}>Difference:</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '22px',
                        color: cashDifference > 0 ? '#16a34a' : cashDifference < 0 ? '#dc2626' : '#374151'
                      }}>
                        {cashDifference > 0 ? '+' : ''}{cashDifference.toFixed(2)} EGP
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: cashDifference > 0 ? '#16a34a' : cashDifference < 0 ? '#dc2626' : '#6b7280',
                        marginTop: '3px'
                      }}>
                        {cashDifference > 0 ? '✅ Overage' : cashDifference < 0 ? '⚠️ Shortage' : '✔️ Balanced'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="footer" style={{
              textAlign: 'center',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '3px solid #e91e63'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%)',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#831843'
                }}>
                  {systemSettings?.invoiceSettings?.footerText || 'Thank you for your dedication!'}
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {systemSettings?.businessName || 'Hi Salon'}
                </p>
              </div>
              <p style={{
                margin: '0',
                fontSize: '12px',
                color: '#9ca3af',
                fontStyle: 'italic'
              }}>
                ⭐ Shift Report • تقرير الوردية ⭐
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 no-print">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            <X className="ml-2 w-4 h-4" />
            إغلاق
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            onClick={handlePrintReport}
          >
            <Printer className="ml-2 w-4 h-4" />
            طباعة التقرير
          </Button>
        </div>
      </Card>
    </div>
  );
}
