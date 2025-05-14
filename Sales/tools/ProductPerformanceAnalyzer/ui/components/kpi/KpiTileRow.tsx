import React from 'react';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import TotalSalesKpi from './TotalSalesKpi';
import AverageMarginKpi from './AverageMarginKpi';
import TopCategoryKpi from './TopCategoryKpi';
import PriceDistributionKpi from './PriceDistributionKpi';
import TotalUnitsKpi from './TotalUnitsKpi';
import { ProductKpiData } from '../../types';

interface KpiTileRowProps {
  data: ProductKpiData;
  loading?: boolean;
}

/**
 * Row of KPI tiles displaying key product performance metrics
 */
export const KpiTileRow: React.FC<KpiTileRowProps> = ({ data, loading = false }) => {
  return (
    <Grid cols={5} gap={16}>
      <GridItem>
        <TotalSalesKpi
          value={data.totalSales.value}
          trend={data.totalSales.trend}
          direction={data.totalSales.direction}
          loading={loading}
        />
      </GridItem>
      
      <GridItem>
        <AverageMarginKpi
          value={data.averageMargin.value}
          trend={data.averageMargin.trend}
          direction={data.averageMargin.direction}
          loading={loading}
        />
      </GridItem>
      
      <GridItem>
        <TopCategoryKpi
          category={data.topCategory.value}
          percentage={data.topCategory.percentage}
          loading={loading}
        />
      </GridItem>
      
      <GridItem>
        <PriceDistributionKpi
          dominantBand={data.priceDistribution.dominant}
          percentage={data.priceDistribution.percentage}
          loading={loading}
        />
      </GridItem>
      
      <GridItem>
        <TotalUnitsKpi
          value={data.totalUnits.value}
          trend={data.totalUnits.trend}
          direction={data.totalUnits.direction}
          loading={loading}
        />
      </GridItem>
    </Grid>
  );
};

export default KpiTileRow; 