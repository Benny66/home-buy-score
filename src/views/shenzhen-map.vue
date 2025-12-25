<template>
  <div class="shenzhen-map-container">   
    <v-chart 
      :option="chartOption" 
      :autoresize="true"
      style="height: 600px; width: 100%;"
    />
  </div>
</template>

<script>
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { MapChart, ScatterChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, VisualMapComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';
// 导入深圳市GeoJSON数据
import shenzhenGeoJSON from '@/assets/area/shenzhen.json';
// 导入深圳地铁站点数据
import trainPointsData from '@/assets/area/shenzhen-train-point.json';
// 引入 echarts 核心模块
import * as echarts from 'echarts/core';

use([CanvasRenderer, MapChart, ScatterChart, TitleComponent, TooltipComponent, VisualMapComponent, LegendComponent]);


export default {
  name: 'ShenzhenMapView',
  components: {
    VChart
  },
  data() {
    return {
      chartOption: {
        title: {
          text: '深圳市行政区划图 - 地铁站点分布',
          left: 'center',
          textStyle: {
            fontSize: 16
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            if (params.componentType === 'series') {
              if (params.seriesType === 'scatter') {
                return `${params.data.station_name}<br/>
                        线路：${params.data.line_name}<br/>
                        状态：${params.data.status}<br/>
                        坐标：[${params.data.coordinates[0].toFixed(6)}, ${params.data.coordinates[1].toFixed(6)}]`;
              } else if (params.seriesType === 'map') {
                return `${params.name}<br/>区域代码：${params.value}`;
              }
            }
            return params.name;
          }
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          data: ['运营中', '建设中', '行政区划']
        },
        visualMap: {
          type: 'piecewise',
          pieces: [
            {min: 440300, max: 440311, label: '深圳市辖区'},
          ],
          left: 'left',
          top: 'bottom',
          textStyle: {
            color: '#000'
          }
        },
        series: [
          {
            name: '行政区划',
            type: 'map',
            map: 'shenzhen',
            roam: true,
            emphasis: {
              label: {
                show: true
              }
            },
            data: [
              {name: '罗湖区', value: 440303},
              {name: '福田区', value: 440304},
              {name: '南山区', value: 440305},
              {name: '宝安区', value: 440306},
              {name: '龙岗区', value: 440307},
              {name: '盐田区', value: 440308},
              {name: '龙华区', value: 440309},
              {name: '坪山区', value: 440310},
              {name: '光明区', value: 440311}
            ],
            nameMap: {
              '深圳市': '深圳'
            }
          },
          {
            name: '运营中',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: [],
            symbolSize: 6,
            itemStyle: {
              color: '#ff0000'
            },
            emphasis: {
              scale: true,
              itemStyle: {
                color: '#ff3333',
                shadowBlur: 10,
                shadowColor: 'rgba(255, 0, 0, 0.5)'
              }
            }
          },
          {
            name: '建设中',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: [],
            symbolSize: 6,
            itemStyle: {
              color: '#00aaff'
            },
            emphasis: {
              scale: true,
              itemStyle: {
                color: '#33ccff',
                shadowBlur: 10,
                shadowColor: 'rgba(0, 170, 255, 0.5)'
              }
            }
          }
        ]
      }
    };
  },
  created() {
    this.registerShenzhenMap();
    this.processTrainPointsData();
  },
  methods: {
    registerShenzhenMap() {
      console.log(shenzhenGeoJSON);
      echarts.registerMap('shenzhen', shenzhenGeoJSON);
    },

    processTrainPointsData() {
      if (trainPointsData && trainPointsData.features) {
        const operatingStations = [];
        const buildingStations = [];

        trainPointsData.features.forEach(feature => {
          const stationData = {
            name: feature.properties.station_name,
            value: feature.geometry.coordinates,
            coordinates: feature.geometry.coordinates,
            station_name: feature.properties.station_name,
            line_name: feature.properties.line_name,
            status: feature.properties.status,
            station_num: feature.properties.station_num
          };

          if (feature.properties.status === '运营中') {
            operatingStations.push(stationData);
          } else if (feature.properties.status === '建设中') {
            buildingStations.push(stationData);
          }
        });

        // 更新图表数据
        this.chartOption.series[1].data = operatingStations;
        this.chartOption.series[2].data = buildingStations;

        console.log(`处理完成：运营中站点 ${operatingStations.length} 个，建设中站点 ${buildingStations.length} 个`);
      }
    }
  }
};
</script>

<style scoped>
.shenzhen-map-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>