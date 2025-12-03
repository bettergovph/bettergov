import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCheckIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  GlobeIcon,
} from 'lucide-react';
import { VisaRequirement } from '../../types/visa';
import visaData from '../../data/visa/philippines_visa_policy.json';

interface VisaRequirementDetailsProps {
  country: string;
  visaRequirement: VisaRequirement;
  isDialog?: boolean;
}

const VisaRequirementDetails: FC<VisaRequirementDetailsProps> = ({
  country,
  visaRequirement,
  isDialog = false,
}) => {
  const { t } = useTranslation('visa');

  return (
    <div className='mt-6'>
      {/* Visa Status Section */}
      {visaRequirement.type === 'visa-free' && (
        <div className='flex items-start p-4 bg-green-50 border border-green-200 rounded-lg'>
          <FileCheckIcon className='h-6 w-6 text-green-600 mr-3 mt-0.5' />
          <div>
            <h3
              className={`font-semibold text-green-800 ${isDialog ? 'text-base' : 'text-lg'}`}
            >
              {t('requirements.visaFree.title')}
            </h3>
            <p className='text-green-700'>
              {t('requirements.visaFree.description', {
                country,
                duration: visaRequirement.duration,
              })}
            </p>
          </div>
        </div>
      )}

      {visaRequirement.type === 'visa-required' && (
        <div className='flex items-start p-4 bg-red-50 border border-red-200 rounded-lg'>
          <AlertCircleIcon className='h-6 w-6 text-red-600 mr-3 mt-0.5' />
          <div>
            <h3
              className={`font-semibold text-red-800 ${isDialog ? 'text-base' : 'text-lg'}`}
            >
              {t('requirements.visaRequired.title')}
            </h3>
            <p className='text-red-700'>
              {t('requirements.visaRequired.description', {
                country,
              })}
            </p>
          </div>
        </div>
      )}

      {visaRequirement.type === 'special-condition' && (
        <div className='flex items-start p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <AlertCircleIcon className='h-6 w-6 text-yellow-600 mr-3 mt-0.5' />
          <div>
            <h3
              className={`font-semibold text-yellow-800 ${isDialog ? 'text-base' : 'text-lg'}`}
            >
              {t('requirements.specialCondition.title')}
            </h3>
            <p className='text-yellow-700'>
              {t('requirements.specialCondition.description', {
                country,
                duration: visaRequirement.duration,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Entry Requirements Section */}
      <div className='mt-6'>
        <h3
          className={`font-medium mb-2 ${isDialog ? 'text-base' : 'text-lg'}`}
        >
          {t('requirements.entryRequirements')}
        </h3>
        <div className='prose prose-sm max-w-none'>
          <p>{visaRequirement.description}</p>

          {visaRequirement.requirements && (
            <div className='mt-4'>
              <h4 className='text-md font-medium mb-2'>
                {t('requirements.requiredDocuments')}
              </h4>
              <ul className='list-disc pl-5 space-y-1'>
                {visaRequirement.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {visaRequirement.additionalInfo && (
            <div className='mt-4 p-3 bg-blue-50 rounded-md text-blue-800'>
              <p>
                <strong>{t('requirements.note')}</strong>{' '}
                {visaRequirement.additionalInfo}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Visa Application Links for visa-required countries */}
      {visaRequirement.type === 'visa-required' && (
        <div className='mt-6'>
          <h3
            className={`font-medium mb-3 ${isDialog ? 'text-base' : 'text-lg'}`}
          >
            {t('visaApplication.title')}
          </h3>
          <div
            className={`grid gap-4 ${isDialog ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}
          >
            <a
              href='https://evisa.gov.ph/'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <div className='rounded-full bg-blue-100 p-2 mr-3'>
                <GlobeIcon className='h-5 w-5 text-blue-600' />
              </div>
              <div className='flex-1'>
                <h4 className='font-medium'>
                  {t('visaApplication.eVisa.title')}
                </h4>
                <p
                  className={`text-gray-600 ${isDialog ? 'text-sm' : 'text-sm'}`}
                >
                  {t('visaApplication.eVisa.description')}
                </p>
                {!isDialog && (
                  <div className='flex items-center text-blue-600 text-sm mt-1'>
                    <span>{t('visaApplication.eVisa.action')}</span>
                    <ExternalLinkIcon className='h-3 w-3 ml-1' />
                  </div>
                )}
              </div>
              {isDialog && (
                <ExternalLinkIcon className='h-4 w-4 text-blue-600' />
              )}
            </a>
            <a
              href='https://dfa.gov.ph/list-of-philippine-embassies-and-consulates-general'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <div className='rounded-full bg-blue-100 p-2 mr-3'>
                <GlobeIcon className='h-5 w-5 text-blue-600' />
              </div>
              <div className='flex-1'>
                <h4 className='font-medium'>
                  {t('visaApplication.embassy.title')}
                </h4>
                <p
                  className={`text-gray-600 ${isDialog ? 'text-sm' : 'text-sm'}`}
                >
                  {t('visaApplication.embassy.description')}
                </p>
                {!isDialog && (
                  <div className='flex items-center text-blue-600 text-sm mt-1'>
                    <span>{t('visaApplication.embassy.action')}</span>
                    <ExternalLinkIcon className='h-3 w-3 ml-1' />
                  </div>
                )}
              </div>
              {isDialog && (
                <ExternalLinkIcon className='h-4 w-4 text-blue-600' />
              )}
            </a>
          </div>
        </div>
      )}

      {/* Additional Info Section */}
      <div className='mt-6 border-t pt-6'>
        <h4 className='text-lg font-medium mb-4'>
          {t('additionalInfo.title')}
        </h4>

        <div className='space-y-4'>
          <div>
            <h5 className='font-medium mb-2'>
              {t('additionalInfo.temporaryVisa.title')}
            </h5>
            <p className='text-sm text-gray-700'>
              {t('additionalInfo.temporaryVisa.description')}
            </p>
            <a
              href='https://evisa.gov.ph/page/policy?l1=Non-Immigrant%20Visas&l2=9(a)%20Temporary%20Visitors%20Visa'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2'
            >
              <span>{t('additionalInfo.temporaryVisa.learnMore')}</span>
              <ExternalLinkIcon className='h-3 w-3 ml-1' />
            </a>
          </div>

          <div>
            <h5 className='font-medium mb-2'>
              {t('additionalInfo.visaExtensions.title')}
            </h5>
            <p className='text-sm text-gray-700'>
              {t('additionalInfo.visaExtensions.description')}
            </p>
            <a
              href='https://immigration.gov.ph/'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2'
            >
              <span>{t('additionalInfo.visaExtensions.visitWebsite')}</span>
              <ExternalLinkIcon className='h-3 w-3 ml-1' />
            </a>
          </div>

          <div className='p-3 bg-yellow-50 rounded-lg'>
            <h5 className='font-medium mb-2 text-yellow-800'>
              {t('additionalInfo.disclaimer.title')}
            </h5>
            <p className='text-yellow-700 text-xs'>
              {visaData.sourceInfo.disclaimer}
            </p>
            <p className='text-yellow-700 text-xs mt-2'>
              Last updated: {visaData.sourceInfo.lastUpdated}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaRequirementDetails;
