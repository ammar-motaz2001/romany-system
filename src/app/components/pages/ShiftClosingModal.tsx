import { useState, useRef } from 'react';
import { X, Printer, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useApp } from '@/app/context/AppContext';

interface ShiftClosingModalProps {
  onClose: () => void;
  sales: any[];
  currentShiftId?: string;
  currentShift?: any;
}

export default function ShiftClosingModal({ onClose, sales: shiftSales, currentShiftId, currentShift }: ShiftClosingModalProps) {
  const { currentUser, systemSettings, updateShift, expenses } = useApp();
  const [actualCash, setActualCash] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');
  const [showReport, setShowReport] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // حساب الإحصائيات من المبيعات المحلية (للاحتياط)
  const derivedStats = (() => {
    const servicesSales = shiftSales
      .filter(sale => !sale.items || sale.items.length === 0)
      .reduce((sum, sale) => sum + sale.amount, 0);
    const productsSales = shiftSales
      .filter(sale => sale.items && sale.items.length > 0)
      .reduce((sum, sale) => sum + sale.amount, 0);
    const totalSales = servicesSales + productsSales;
    const discounts = shiftSales.reduce((sum, sale) => {
      if (sale.discount && sale.subtotal) return sum + (sale.subtotal - sale.amount);
      return sum;
    }, 0);
    const netSales = totalSales - discounts;
    const cashPayments = shiftSales
      .filter(sale => sale.paymentMethod === 'نقدي' || sale.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + sale.amount, 0);
    const cardPayments = shiftSales
      .filter(sale => sale.paymentMethod === 'بطاقة' || sale.paymentMethod === 'card')
      .reduce((sum, sale) => sum + sale.amount, 0);
    const instaPayPayments = shiftSales
      .filter(sale => sale.paymentMethod === 'InstaPay' || sale.paymentMethod === 'instapay')
      .reduce((sum, sale) => sum + sale.amount, 0);
    const shiftExpenses = expenses
      .filter(expense => {
        if (!currentShift) return false;
        const expenseDate = new Date(expense.date);
        const shiftStart = new Date(currentShift.startTime);
        return expenseDate >= shiftStart && expense.paymentMethod === 'نقدي';
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
    return {
      totalSales,
      discounts,
      netSales,
      cashPayments,
      cardPayments,
      instaPayPayments,
      transactionsCount: shiftSales.length,
      shiftExpenses,
    };
  })();

  // تفضيل البيانات الحقيقية من الـ API (الوردية) عند توفرها
  const apiTotalSales = currentShift != null && typeof (currentShift as { totalSales?: number }).totalSales === 'number'
    ? Number((currentShift as { totalSales?: number }).totalSales)
    : null;
  const apiSalesDetails = currentShift?.salesDetails as { cash?: number; card?: number; instapay?: number } | undefined;
  const apiTotalExpenses = currentShift != null && typeof (currentShift as { totalExpenses?: number }).totalExpenses === 'number'
    ? Number((currentShift as { totalExpenses?: number }).totalExpenses)
    : null;
  const hasApiData = apiTotalSales !== null || (apiSalesDetails && typeof apiSalesDetails.cash === 'number');

  const stats = {
    totalSales: hasApiData && apiTotalSales !== null ? apiTotalSales : derivedStats.totalSales,
    discounts: derivedStats.discounts,
    netSales: hasApiData && apiTotalSales !== null ? apiTotalSales - derivedStats.discounts : derivedStats.netSales,
    cashPayments: (hasApiData && apiSalesDetails && typeof apiSalesDetails.cash === 'number') ? apiSalesDetails.cash : derivedStats.cashPayments,
    cardPayments: (hasApiData && apiSalesDetails && typeof apiSalesDetails.card === 'number') ? apiSalesDetails.card : derivedStats.cardPayments,
    instaPayPayments: (hasApiData && apiSalesDetails && typeof apiSalesDetails.instapay === 'number') ? apiSalesDetails.instapay : derivedStats.instaPayPayments,
    transactionsCount: derivedStats.transactionsCount,
    shiftExpenses: (hasApiData && apiTotalExpenses !== null) ? apiTotalExpenses : derivedStats.shiftExpenses,
  };

  const openingBalance = Number(currentShift?.startingCash ?? currentShift?.openingBalance ?? 0);
  const expectedCash = openingBalance + stats.cashPayments - stats.shiftExpenses;
  const actualCashNum = parseFloat(actualCash) || 0;
  const cashDifference = actualCashNum - expectedCash;

  const handleCloseShift = () => {
    if (!actualCash) {
      alert('يرجى إدخال قيمة الكاش الفعلي!');
      return;
    }

    if (Math.abs(cashDifference) > 0 && !differenceReason) {
      alert('يرجى إدخال سبب الفرق في الكاش!');
      return;
    }

    // إغلاق الوردية
    setShowReport(true);
  };

  const handlePrintReport = () => {
    // Set page title for print
    const originalTitle = document.title;
    document.title = `Shift Report - ${new Date().toLocaleDateString('en-US')} - ${currentUser?.name ?? currentUser?.username ?? 'كاشير'}`;
    
    // Trigger print
    setTimeout(() => {
      window.print();
      
      // Restore original title
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    }, 100);
  };

  const handleConfirmClose = () => {
    // Update shift with final data
    if (currentShiftId) {
      updateShift(currentShiftId, {
        endTime: new Date().toISOString(),
        totalSales: stats.netSales,
        finalCash: actualCashNum,
        status: 'closed',
        salesDetails: {
          cash: stats.cashPayments,
          card: stats.cardPayments,
          instapay: stats.instaPayPayments,
        },
      });
    }

    // Print automatically
    handlePrintReport();
    
    setTimeout(() => {
      onClose();
      alert('تم إغلاق الوردية بنجاح!');
    }, 500);
  };

  if (showReport) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <Card className="w-full max-w-4xl p-6 m-4 dark:bg-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div ref={printRef} className="print-content">
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
                      📅 {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
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
                      🕐 {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
                      👤 {currentUser?.firstName} {currentUser?.lastName}
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
                  <div className="row" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Total Transactions:</span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{stats.transactionsCount}</span>
                  </div>
                  <div className="row" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Total Sales:</span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{stats.totalSales.toFixed(2)} ج.م</span>
                  </div>
                  <div className="row" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '2px solid #22c55e',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#dc2626' }}>Discounts:</span>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>-{stats.discounts.toFixed(2)} ج.م</span>
                  </div>
                  <div className="row total" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '15px 0 0 0',
                    fontSize: '18px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#166534' }}>Net Sales:</span>
                    <span style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '20px' }}>{stats.netSales.toFixed(2)} ج.م</span>
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
                    <div style={{
                      fontSize: '28px',
                      marginBottom: '8px'
                    }}>💵</div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '5px',
                      fontWeight: '500'
                    }}>Cash</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#16a34a'
                    }}>{stats.cashPayments.toFixed(2)}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>EGP</div>
                  </div>
                  <div style={{
                    background: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '2px solid #dbeafe',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{
                      fontSize: '28px',
                      marginBottom: '8px'
                    }}>💳</div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '5px',
                      fontWeight: '500'
                    }}>Card</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#2563eb'
                    }}>{stats.cardPayments.toFixed(2)}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>EGP</div>
                  </div>
                  <div style={{
                    background: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '2px solid #fef3c7',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{
                      fontSize: '28px',
                      marginBottom: '8px'
                    }}>📱</div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '5px',
                      fontWeight: '500'
                    }}>InstaPay</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#d97706'
                    }}>{stats.instaPayPayments.toFixed(2)}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>EGP</div>
                  </div>
                </div>
              </div>

              {/* Cash Reconciliation Section */}
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
                  <div className="row" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Opening Balance:</span>
                    <span style={{ fontWeight: '600', color: '#3b82f6' }}>{openingBalance.toFixed(2)} EGP</span>
                  </div>
                  <div className="row" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Cash Sales:</span>
                    <span style={{ fontWeight: '600', color: '#16a34a' }}>+{stats.cashPayments.toFixed(2)} EGP</span>
                  </div>
                  <div className="row" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '2px solid #f59e0b',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Cash Expenses:</span>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>-{stats.shiftExpenses.toFixed(2)} EGP</span>
                  </div>
                  <div className="row" style={{
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
                  <div className="row" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '2px solid #333',
                    fontSize: '15px'
                  }}>
                    <span style={{ color: '#6b7280' }}>Actual Cash Counted:</span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{actualCashNum.toFixed(2)} EGP</span>
                  </div>
                  <div className="row total difference" style={{
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
                  {differenceReason && (
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px', fontWeight: '600' }}>
                        Reason:
                      </div>
                      <div style={{ fontSize: '14px', color: '#111827' }}>
                        {differenceReason}
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                  ⭐ Shift closed successfully • تم إغلاق الوردية بنجاح ⭐
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
              إلغاء
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              onClick={handleConfirmClose}
            >
              <Printer className="ml-2 w-4 h-4" />
              طباعة وإغلاق الوردية
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-4xl p-6 m-4 dark:bg-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            تقفيل الوردية
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* ملخص الوردية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* إجمالي المبيعات */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalSales.toFixed(2)} ج.م</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          {/* عدد المعاملات */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">عدد المعاملات</p>
                <p className="text-2xl font-bold text-blue-600">{stats.transactionsCount}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

        </div>

        {/* الخصومات وصافي المبيعات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">الخصومات</p>
            <p className="text-xl font-bold text-red-600">-{stats.discounts.toFixed(2)} ج.م</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-400">صافي المبيعات</p>
            <p className="text-xl font-bold text-green-600">{stats.netSales.toFixed(2)} ج.م</p>
          </Card>
        </div>

        {/* طرق الدفع */}
        <Card className="p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">تفصيل طرق الدفع</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span>نقدي (Cash)</span>
              </span>
              <span className="font-bold">{stats.cashPayments.toFixed(2)} ج.م</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span>بطاقة (Card)</span>
              </span>
              <span className="font-bold">{stats.cardPayments.toFixed(2)} ج.م</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span>InstaPay</span>
              </span>
              <span className="font-bold">{stats.instaPayPayments.toFixed(2)} ج.م</span>
            </div>
          </div>
        </Card>

        {/* عد الكاش */}
        <Card className="p-4 mb-6 border-2 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10">
          <div className="flex items-start gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-600">تسوية الكاش</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-600">يرجى عد الكاش الموجود في الدرج وإدخال القيمة الفعلية</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* الرصيد الافتتاحي */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الرصيد الافتتاحي
                </label>
                <Input
                  type="text"
                  value={`${openingBalance.toFixed(2)} ج.م`}
                  disabled
                  className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مبيعات نقدية
                </label>
                <Input
                  type="text"
                  value={`+${stats.cashPayments.toFixed(2)} ج.م`}
                  disabled
                  className="bg-green-50 dark:bg-green-900/20 border-green-200 font-semibold text-green-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مصروفات نقدية
                </label>
                <Input
                  type="text"
                  value={`-${stats.shiftExpenses.toFixed(2)} ج.م`}
                  disabled
                  className="bg-red-50 dark:bg-red-900/20 border-red-200 font-semibold text-red-700"
                />
              </div>
            </div>

            {/* الكاش المتوقع */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الكاش المتوقع في الدرج
              </label>
              <Input
                type="text"
                value={`${expectedCash.toFixed(2)} ج.م`}
                disabled
                className="bg-purple-100 dark:bg-purple-900/30 border-purple-300 text-purple-900 dark:text-purple-300 font-bold text-lg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                = الرصيد الافتتاحي + المبيعات النقدية - المصروفات النقدية
              </p>
            </div>

            {/* الكاش الفعلي */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الكاش الفعلي المعدود <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="أدخل قيمة الكاش الفعلي"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="text-lg font-bold border-2"
              />
            </div>

            {actualCash && (
              <div className={`p-4 rounded-lg ${
                cashDifference > 0 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : cashDifference < 0 
                  ? 'bg-red-100 dark:bg-red-900/20' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">الفرق:</span>
                  <span className={`text-xl font-bold ${
                    cashDifference > 0 
                      ? 'text-green-600' 
                      : cashDifference < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {cashDifference > 0 ? '+' : ''}{cashDifference.toFixed(2)} ج.م
                    {cashDifference > 0 ? ' (زيادة)' : cashDifference < 0 ? ' (عجز)' : ' (متطابق)'}
                  </span>
                </div>
              </div>
            )}

            {actualCash && Math.abs(cashDifference) > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  سبب الفرق <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="أدخل سبب الزيادة أو العجز في الكاش"
                  value={differenceReason}
                  onChange={(e) => setDifferenceReason(e.target.value)}
                />
              </div>
            )}
          </div>
        </Card>

        {/* أزرار التحكم */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            إلغاء
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            onClick={handleCloseShift}
          >
            تأكيد إغلاق الوردية
          </Button>
        </div>
      </Card>
    </div>
  );
}