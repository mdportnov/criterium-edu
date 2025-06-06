import DataSourceLocal from './data-source.local';
import DataSourceProd from './data-source.prod';

export default process.env.NODE_ENV === 'production'
  ? DataSourceProd
  : DataSourceLocal;
