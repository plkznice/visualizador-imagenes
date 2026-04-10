/**
 * Punto de entrada principal de la extensión.
 * Aquí definimos cómo se integra nuestro panel lateral en la interfaz general (visor).
 */

import React from 'react';
import { id } from './id';
import PanelDictation from './components/PanelDictation';
import type { Types } from '@ohif/core';

/**
 * Retorna la configuración del panel lateral.
 * Especifica el ícono, título y qué componente de React se debe renderizar.
 */
function getPanelModule() {
  return [
    {
      name: 'xraiDictation',
      iconName: 'tab-patient-info',
      iconLabel: 'XRAI',
      label: 'XRAI Dictado',
      component: () => <PanelDictation />,
    },
  ];
}

/**
 * Estructura de la extensión exportada para ser consumida por el viewer.
 */
const xraiDictationExtension: Types.Extensions.Extension = {
  id,
  getPanelModule,
};

export default xraiDictationExtension;
export { id };
