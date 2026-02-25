# Flood Control Projects Dashboard

This directory contains data and scripts for the Flood Control Projects Dashboard, which visualizes flood control infrastructure projects across the Philippines.

## Data Structure

The main data source is a large JSON file (`flood_control.json`) containing detailed information about flood control projects. The data has been processed to extract lookup values for key fields, which are stored in the `lookups` directory.

### Lookup Data Files

The following lookup files are available in the `lookups` directory:

- `InfraYear.json` / `InfraYear_with_counts.json`: Infrastructure years with project counts
- `Region.json` / `Region_with_counts.json`: Regions with project counts
- `Province.json` / `Province_with_counts.json`: Provinces with project counts
- `Contractor.json` / `Contractor_with_counts.json`: Contractors with project counts
- `DistrictEngineeringOffice.json` / `DistrictEngineeringOffice_with_counts.json`: District engineering offices with project counts
- `LegislativeDistrict.json` / `LegislativeDistrict_with_counts.json`: Legislative districts with project counts
- `TypeofWork.json` / `TypeofWork_with_counts.json`: Types of work with project counts

Each `*_with_counts.json` file contains an array of objects with `value` and `count` properties, where `count` represents the number of projects for that value.

## Data Processing Scripts

- `extract_lookups_jsonstream.js`: The final extraction script that uses JSONStream to efficiently parse the large JSON file and extract lookup data with counts
- Other extraction scripts show the evolution of the data processing approach

## Meilisearch Integration

The flood control data is indexed in Meilisearch for efficient searching. The index name is `bettergov_flood_control`.

### Indexing Script

The script `scripts/index_flood_control_arcgis.js` is used to index the flood control data in Meilisearch. It processes the large JSON file and indexes each project with appropriate attributes for searching and filtering.

### Searchable Attributes

- ProjectDescription
- Municipality
- Region
- Province
- ContractID
- ProjectID
- Contractor
- LegislativeDistrict
- DistrictEngineeringOffice

### Filterable Attributes

- Municipality
- Region
- Province
- StartDate
- CompletionDateActual
- FundingYear
- TypeofWork
- LegislativeDistrict
- DistrictEngineeringOffice
- GlobalID

## Dashboard Features

The flood control projects dashboard (`/flood-control-projects`) provides:

1. Interactive visualizations of project data:
   - Projects by year (bar chart)
   - Top regions by project count (line chart)
   - Distribution by type of work (pie chart)

2. Filtering capabilities for:
   - Infrastructure Year
   - Region
   - Province
   - Type of Work
   - District Engineering Office
   - Legislative District

3. Search functionality using Meilisearch to find specific projects

4. Summary statistics showing key metrics about the flood control projects

## Data Source

The data is sourced from the Department of Public Works and Highways (DPWH) Flood Control Information System.
