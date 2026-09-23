// Registro central de telas: abas por perfil (MainTabs) e telas empilhadas (RootNavigator).
import HomeScreen from './home/HomeScreen';
import AnalysisInboxScreen from './analysis/AnalysisInboxScreen';
import RdoListScreen from './rdo/RdoListScreen';
import RdoDetailScreen from './rdo/RdoDetailScreen';
import RdoFormScreen from './rdo/RdoFormScreen';
import SignMasterScreen from './docs/SignMasterScreen';
import SignClientScreen from './docs/SignClientScreen';
import ReceiptScreen from './docs/ReceiptScreen';
import PdfViewerScreen from './docs/PdfViewerScreen';
import NotificationsScreen from './docs/NotificationsScreen';
import FilesScreen from './docs/FilesScreen';
import ObrasListScreen from './obras/ObrasListScreen';
import ObraDetailScreen from './obras/ObraDetailScreen';
import ObraFormScreen from './obras/ObraFormScreen';
import MoreScreen from './admin/MoreScreen';
import SettingsScreen from './admin/SettingsScreen';
import SyncScreen from './admin/SyncScreen';
import AuditScreen from './admin/AuditScreen';
import UsersScreen from './admin/UsersScreen';
import UserFormScreen from './admin/UserFormScreen';
import PermissionsScreen from './admin/PermissionsScreen';
import CadastrosScreen from './admin/CadastrosScreen';
import CatalogScreen from './admin/CatalogScreen';
import EmpresaScreen from './admin/EmpresaScreen';
import ClientesScreen from './admin/ClientesScreen';
import ReportsScreen from './reports/ReportsScreen';
import AcademicScreen from './academic/AcademicScreen';
import AcademicGroupScreen from './academic/AcademicGroupScreen';

// Telas raiz das abas (compartilhadas entre perfis quando faz sentido).
export const TAB_SCREENS = {
  Home: HomeScreen,
  Analysis: AnalysisInboxScreen,
  Rdos: RdoListScreen,
  Obras: ObrasListScreen,
  Notifications: NotificationsScreen,
  Files: FilesScreen,
  More: MoreScreen,
};

// Telas empilhadas (push) disponíveis após o login.
export const STACK_SCREENS = [
  { name: 'RdoDetail', component: RdoDetailScreen },
  { name: 'RdoList', component: RdoListScreen },
  { name: 'RdoForm', component: RdoFormScreen },
  { name: 'SignMaster', component: SignMasterScreen },
  { name: 'SignClient', component: SignClientScreen },
  { name: 'Receipt', component: ReceiptScreen },
  { name: 'PdfViewer', component: PdfViewerScreen },
  { name: 'ObrasList', component: ObrasListScreen },
  { name: 'ObraDetail', component: ObraDetailScreen },
  { name: 'ObraForm', component: ObraFormScreen },
  { name: 'Notifications', component: NotificationsScreen },
  { name: 'Files', component: FilesScreen },
  { name: 'Users', component: UsersScreen },
  { name: 'UserForm', component: UserFormScreen },
  { name: 'Permissions', component: PermissionsScreen },
  { name: 'Cadastros', component: CadastrosScreen },
  { name: 'Catalog', component: CatalogScreen },
  { name: 'Empresa', component: EmpresaScreen },
  { name: 'Clientes', component: ClientesScreen },
  { name: 'Reports', component: ReportsScreen },
  { name: 'Academic', component: AcademicScreen },
  { name: 'AcademicGroup', component: AcademicGroupScreen },
  { name: 'Settings', component: SettingsScreen },
  { name: 'Audit', component: AuditScreen },
  { name: 'Sync', component: SyncScreen },
];
