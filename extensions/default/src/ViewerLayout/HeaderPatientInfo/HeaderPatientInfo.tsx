import React, { useState, useEffect } from 'react';
import usePatientInfo from '../../hooks/usePatientInfo';
import { Icons } from '@ohif/ui-next';

export enum PatientInfoVisibility {
  VISIBLE = 'visible',
  VISIBLE_COLLAPSED = 'visibleCollapsed',
  DISABLED = 'disabled',
  VISIBLE_READONLY = 'visibleReadOnly',
}

const formatWithEllipsis = (str, maxLength) => {
  if (str?.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
};

function HeaderPatientInfo({ servicesManager, appConfig }: withAppTypes<{ appConfig: AppTypes.Config }>) {
  const initialExpandedState =
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE ||
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE_READONLY;
  const [expanded, setExpanded] = useState(initialExpandedState);
  const { patientInfo, isMixedPatients } = usePatientInfo();

  useEffect(() => {
    if (isMixedPatients && expanded) {
      setExpanded(false);
    }
  }, [isMixedPatients, expanded]);

  const handleOnClick = () => {
    if (!isMixedPatients && appConfig.showPatientInfo !== PatientInfoVisibility.VISIBLE_READONLY) {
      setExpanded(!expanded);
    }
  };

  const formattedPatientName = formatWithEllipsis(patientInfo.PatientName, 27);
  const formattedPatientID = formatWithEllipsis(patientInfo.PatientID, 15);

  return (
    <div
      className="flex items-start justify-center gap-2 rounded-lg py-2 px-3"
    >
      {isMixedPatients ? (
        <Icons.MultiplePatients className="text-primary" />
      ) : (
        <Icons.Patient className="text-primary" />
      )}
      <div className="flex flex-col justify-center">
        {isMixedPatients && !expanded ? (
          <div className="text-primary self-center text-[13px]">Multiple Patients</div>
        ) : (
          <>
            <div className="text-foreground self-start text-[14px] font-bold">
              {formattedPatientName}
            </div>
            <div className="text-muted-foreground flex flex-col gap-[2px] text-[12px] mt-[4px]">
              {formattedPatientID && <div>{formattedPatientID}</div>}
              {patientInfo.PatientAge !== null && <div>{patientInfo.PatientAge} años</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HeaderPatientInfo;
