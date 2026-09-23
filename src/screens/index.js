// Registro central de telas. Telas ainda não implementadas usam <Placeholder />.
import Placeholder from './Placeholder';
import HomeScreen from './home/HomeScreen';
import AnalysisInboxScreen from './analysis/AnalysisInboxScreen';
import RdoListScreen from './rdo/RdoListScreen';
import RdoDetailScreen from './rdo/RdoDetailScreen';
import RdoFormScreen from './rdo/RdoFormScreen';

const P = Placeholder;

// Telas raiz das abas (compartilhadas entre perfis quando faz sentido).
export const TAB_SCREENS = {
  Home: HomeScreen,
  Analysis: AnalysisInboxScreen,
  Rdos: RdoListScreen,
  Obras: P,
  Notifications: P,
  Files: P,
  More: P,
};

// Telas empilhadas (push) disponíveis após o login.
export const STACK_SCREENS = [
  { name: 'RdoDetail', component: RdoDetailScreen },
  { name: 'RdoList', component: RdoListScreen },
  { name: 'RdoForm', component: RdoFormScreen },
  { name: 'SignMaster', component: P },
  { name: 'SignClient', component: P },
  { name: 'Receipt', component: P },
  { name: 'PdfViewer', component: P },
  { name: 'ObraDetail', component: P },
  { name: 'ObraForm', component: P },
  { name: 'Notifications', component: P },
  { name: 'Files', component: P },
  { name: 'Users', component: P },
  { name: 'UserForm', component: P },
  { name: 'Permissions', component: P },
  { name: 'Cadastros', component: P },
  { name: 'Catalog', component: P },
  { name: 'Reports', component: P },
  { name: 'Academic', component: P },
  { name: 'AcademicGroup', component: P },
  { name: 'Settings', component: P },
  { name: 'Audit', component: P },
  { name: 'Sync', component: P },
];
