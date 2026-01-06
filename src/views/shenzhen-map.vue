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
// 导入2026年深圳新开楼盘预测数据
import buildingData from '@/doc/2026年深圳新开楼盘预测.json';
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
          text: '深圳市行政区划图 - 2026年新开楼盘预测',
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
                const data = params.data;
                return `
                  <div style="font-weight: bold; margin-bottom: 8px;">${data.building_name}</div>
                  <div>行政区：${data.administrative_district}</div>
                  <div>区域：${data.area}</div>
                  <div>物业类型：${data.property_type}</div>
                  <div>参考户型：${data.reference_house_type}</div>
                  <div>状态：${data.remarks}</div>
                  <div>坐标：[${data.coordinates[0].toFixed(6)}, ${data.coordinates[1].toFixed(6)}]</div>
                `;
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
          data: ['住宅', '公寓', '商业', '办公', '酒店', '产业用房', '行政区划']
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
        geo: {
          map: 'shenzhen',
          roam: true,
          label: {
            emphasis: {
              show: true
            }
          },
          itemStyle: {
            areaColor: '#f5f5f5',
            borderColor: '#ccc'
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
            name: '住宅',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: [],
            symbol: 'circle',
            symbolSize: 10,
            itemStyle: {
              color: '#e74c3c'
            },
            emphasis: {
              scale: true,
              itemStyle: {
                color: '#c0392b',
                shadowBlur: 10,
                shadowColor: 'rgba(231, 76, 60, 0.5)'
              }
            }
          },
          {
            name: '公寓',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: [],
            symbol: 'rect',
            symbolSize: 10,
            itemStyle: {
              color: '#3498db'
            },
            emphasis: {
              scale: true,
              itemStyle: {
                color: '#2980b9',
                shadowBlur: 10,
                shadowColor: 'rgba(52, 152, 219, 0.5)'
              }
            }
          },
          {
            name: '商业',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: [],
            symbol: 'diamond',
            symbolSize: 10,
            itemStyle: {
              color: '#9b59b6'
            },
            emphasis: {
              scale: true,
              itemStyle: {
                color: '#8e44ad',
                shadowBlur: 10,
                shadowColor: 'rgba(155, 89, 182, 0.5)'
              }
            }
          },
          {
            name: '办公',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: [],
            symbol: 'triangle',
            symbolSize: 10,
            itemStyle: {
              color: '#f39c12'
            },
            emphasis: {
              scale: true,
              itemStyle: {
                color: '#d35400',
                shadowBlur: 10,
                shadowColor: 'rgba(243, 156, 18, 0.5)'
              }
            }
          },
          {
            name: '酒店',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: [],
            symbol: 'pin',
            symbolSize: 10,
            itemStyle: {
              color: '#1abc9c'
            },
            emphasis: {
              scale: true,
              itemStyle: {
                color: '#16a085',
                shadowBlur: 10,
                shadowColor: 'rgba(26, 188, 156, 0.5)'
              }
            }
          },
          {
            name: '产业用房',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: [],
            symbol: 'arrow',
            symbolSize: 10,
            itemStyle: {
              color: '#95a5a6'
            },
            emphasis: {
              scale: true,
              itemStyle: {
                color: '#7f8c8d',
                shadowBlur: 10,
                shadowColor: 'rgba(149, 165, 166, 0.5)'
              }
            }
          }
        ]
      }
    };
  },
  created() {
    this.registerShenzhenMap();
    this.processBuildingData();
  },
  methods: {
    registerShenzhenMap() {
      console.log('注册深圳地图:', shenzhenGeoJSON);
      echarts.registerMap('shenzhen', shenzhenGeoJSON);
    },

    processBuildingData() {
      if (buildingData && buildingData.data) {
        console.log('原始楼盘数据:', buildingData.data);

        const propertyTypeMap = {
          '住宅': [],
          '公寓': [],
          '商业': [],
          '办公': [],
          '酒店': [],
          '产业用房': []
        };

        buildingData.data.forEach((item, index) => {
          try {
            // 解析坐标 - 注意ECharts需要[经度, 纬度]格式
            const coords = item.coordinates.split(',').map(coord => parseFloat(coord.trim()));
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              const buildingDataItem = {
                ...item,
                coordinates: coords,
                value: coords // ECharts scatter需要value字段作为坐标
              };

              // 根据物业类型分类
              const propertyTypes = item.property_type.split('、');
              propertyTypes.forEach(type => {
                const trimmedType = type.trim();
                if (propertyTypeMap[trimmedType]) {
                  propertyTypeMap[trimmedType].push(buildingDataItem);
                }
              });

              console.log(`处理第${index + 1}个楼盘:`, item.building_name, '坐标:', coords);
            } else {
              console.warn(`坐标格式错误: ${item.coordinates}`, item.building_name);
            }
          } catch (error) {
            console.error(`处理楼盘数据出错:`, item, error);
          }
        });

        // 更新图表数据
        Object.keys(propertyTypeMap).forEach((type, index) => {
          const seriesIndex = index + 1;
          if (this.chartOption.series[seriesIndex]) {
            this.chartOption.series[seriesIndex].data = propertyTypeMap[type];
            console.log(`${type}类型数据:`, propertyTypeMap[type].length, '个项目');
          }
        });

        console.log('楼盘数据处理完成，总计:', buildingData.data.length, '个项目');
      } else {
        console.error('楼盘数据加载失败');
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