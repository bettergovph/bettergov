import ConstitutionIndex from './index';

export default function ConstitutionVersionPage() {
  // The index component reads the :version URL param and renders
  // either the timeline overview or the matching version's detail.
  return <ConstitutionIndex />;
}
