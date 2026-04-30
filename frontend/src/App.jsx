import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { LicenseProvider, useLicense } from './context/LicenseContext';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import ActivationResponsive from './pages/ActivationResponsive';

// Direct imports for instant navigation (no lazy loading = no loading spinner flicker)
import LoginResponsive from './pages/LoginResponsive';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import CreateSalesOrder from './pages/CreateSalesOrder';
import EditSalesOrder from './pages/EditSalesOrder';
import CreateInvoice from './pages/CreateInvoice';
import Purchase from './pages/Purchase';
import CreatePurchaseOrder from './pages/CreatePurchaseOrder';
import EditPurchaseOrder from './pages/EditPurchaseOrder';
import Accounting from './pages/Accounting';
import HR from './pages/HR';
import Reports from './pages/Reports';
import MediaManager from './pages/MediaManager';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';

/**
 * LicenseGate — wraps the entire application.
 * If no valid license → shows ActivationPage.
 * If license active → shows normal app routes.
 */
const LicenseGate = ({ children }) => {
    const { isLicenseActive } = useLicense();

    if (!isLicenseActive) {
        return <ActivationResponsive />;
    }

    return children;
};

const ProtectedRoute = ({ children, requiredPermission }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-surface-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (!requiredPermission) return children;
    if (user.role === 'Super Admin') return children;
    if (user.permissions && user.permissions.includes('*')) return children;
    
    // Quick fallback check
    if (user.permissions && user.permissions.includes(requiredPermission)) return children;
    
    // Redirect unauthorized users back to the dashboard securely
    return <Navigate to="/dashboard" replace />;
};

const Router = typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? HashRouter
    : BrowserRouter;

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
                <I18nProvider>
                    <LicenseProvider>
                        <LicenseGate>
                            <AuthProvider>
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/login" element={<LoginResponsive />} />

                                    {/* Protected Routes (wrapped in MainLayout) */}
                                    <Route path="/" element={<MainLayout />}>
                                        <Route index element={<Navigate to="/dashboard" replace />} />
                                        <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                                        <Route path="admin" element={<ProtectedRoute requiredPermission="manage_users"><ErrorBoundary><Admin /></ErrorBoundary></ProtectedRoute>} />
                                        <Route path="inventory" element={<ErrorBoundary><Inventory /></ErrorBoundary>} />
                                        <Route path="sales" element={<ErrorBoundary><Sales /></ErrorBoundary>} />
                                        <Route path="sales/new" element={<ErrorBoundary><CreateSalesOrder /></ErrorBoundary>} />
                                        <Route path="sales/:id/edit" element={<ErrorBoundary><EditSalesOrder /></ErrorBoundary>} />
                                        <Route path="invoices/new" element={<ErrorBoundary><CreateInvoice /></ErrorBoundary>} />
                                        <Route path="purchases" element={<ErrorBoundary><Purchase /></ErrorBoundary>} />
                                        <Route path="purchases/new" element={<ErrorBoundary><CreatePurchaseOrder /></ErrorBoundary>} />
                                        <Route path="purchases/:id/edit" element={<ErrorBoundary><EditPurchaseOrder /></ErrorBoundary>} />
                                        <Route path="accounting" element={<ErrorBoundary><Accounting /></ErrorBoundary>} />
                                        <Route path="hr" element={<ProtectedRoute requiredPermission="view_hr"><ErrorBoundary><HR /></ErrorBoundary></ProtectedRoute>} />
                                        <Route path="reports" element={<ProtectedRoute requiredPermission="view_reports"><ErrorBoundary><Reports /></ErrorBoundary></ProtectedRoute>} />
                                        <Route path="media" element={<ErrorBoundary><MediaManager /></ErrorBoundary>} />
                                        <Route path="customers" element={<ErrorBoundary><Customers /></ErrorBoundary>} />
                                        <Route path="vendors" element={<ErrorBoundary><Vendors /></ErrorBoundary>} />
                                        <Route path="analytics" element={<ProtectedRoute requiredPermission="view_reports"><ErrorBoundary><Analytics /></ErrorBoundary></ProtectedRoute>} />
                                        <Route path="audit-logs" element={<ProtectedRoute requiredPermission="manage_users"><ErrorBoundary><AuditLogs /></ErrorBoundary></ProtectedRoute>} />
                                    </Route>

                                    {/* Catch-all redirect */}
                                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                                </Routes>
                            </AuthProvider>
                        </LicenseGate>
                    </LicenseProvider>
                </I18nProvider>
            </ErrorBoundary>
        </Router>
    );
}

export default App;
