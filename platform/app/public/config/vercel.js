/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  experimentalStudyBrowserSort: false,
  strictZSpacingForVolumeViewport: true,
  studyPrefetcher: {
    enabled: true,
    displaySetsCount: 2,
    maxNumPrefetchRequests: 10,
    order: 'closest',
  },
  // Configuración XRAI — reemplazá con la URL real y tus credenciales
  xraiApiUrl: 'http://localhost:3000',
  xraiApiKey: 'xrai-ext-2026-bioimagenes',
  xraiClinicId: '4361ff84-7948-404b-b790-1939d6c1d571', // bioimagenes

  defaultDataSourceName: 'orthanc',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'orthanc',
      configuration: {
        friendlyName: 'Bio Imagenes Orthanc',
        name: 'Orthanc',
        wadoUriRoot: 'https://respectively-nations-away-sleeve.trycloudflare.com/wado',
        qidoRoot: 'https://respectively-nations-away-sleeve.trycloudflare.com/dicom-web',
        wadoRoot: 'https://respectively-nations-away-sleeve.trycloudflare.com/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        dicomUploadEnabled: true,
        omitQuotationForMultipartRequest: true,
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],
  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement('img', {
        src: './bio_imagenes_white.png',
        alt: 'Bio Imagenes Mendoza',
        style: { height: '64px', width: 'auto' },
      });
    },
  },
  httpErrorHandler: error => {
    console.warn(`HTTP Error Handler (status: ${error.status})`, error);
  },
};
