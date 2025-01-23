// Remove unused imports
// import { Header } from '../components/Header'
// import { BlobProviderProps } from '@react-pdf/renderer'

// ... existing code ...

// Either use the summary variable or remove it
// const summary = ... // Comment out or remove if unused

// Fix unescaped entities in strings
// Replace all instances of single quotes with &apos;
return (
  <div>
    {/* Replace lines containing unescaped single quotes with: */}
    <p>Driver&apos;s Report</p>
    <span>Today&apos;s Summary</span>
    <div>Customer&apos;s Details</div>
    <p>Driver&apos;s Notes</p>
    <span>Today&apos;s Routes</span>
    <div>Vehicle&apos;s Status</div>
    <p>Day&apos;s Overview</p>
    <span>Route&apos;s Details</span>
    <div>Driver&apos;s Performance</div>
    <p>Today&apos;s Statistics</p>
    {/* ... existing code ... */}
  </div>
) 