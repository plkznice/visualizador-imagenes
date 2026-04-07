import React from 'react';
import { id } from './id';
import PanelDictation from './PanelDictation';
import type { Types } from '@ohif/core';

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

const xraiDictationExtension: Types.Extensions.Extension = {
  id,
  getPanelModule,
};

export default xraiDictationExtension;
export { id };
