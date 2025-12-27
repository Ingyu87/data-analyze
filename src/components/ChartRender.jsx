import React, { useEffect, useState } from 'react';

const ChartRender = ({ data, chartType = 'line', chartDivId = 'chart-div' }) => {
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const [Plotly, setPlotly] = useState(null);

  // Lazy load Plotly
  useEffect(() => {
    import('plotly.js').then((plotlyModule) => {
      setPlotly(plotlyModule.default);
      setPlotlyLoaded(true);
    }).catch((error) => {
      console.error('Failed to load Plotly:', error);
    });
  }, []);

  useEffect(() => {
    if (!plotlyLoaded || !Plotly) return;
    
    const div = document.getElementById(chartDivId);
    if (!div) return;

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#e9d5ff' },
      xaxis: { showgrid: false, color: '#a78bfa' },
      yaxis: { showgrid: true, gridcolor: '#4c1d95', color: '#a78bfa' },
      margin: { t: 40, r: 20, l: 40, b: 40 }
    };

    if (data.type === 'single') {
      const x = data.dataset.map((d) => d.originalLabel || d.label);
      const y = data.dataset.map((d) => d.value);
      
      const traces = [];
      
      if (chartType === 'line') {
        // 꺾은선 그래프
        traces.push({
          x,
          y,
          mode: 'lines+markers',
          name: '현재 기록',
          line: { color: '#c084fc', width: 3 },
          marker: { size: 8, color: '#c084fc' },
          type: 'scatter'
        });
        
        // 미래 예측선
        if (data.nextVal !== undefined) {
          traces.push({
            x: [x[x.length - 1], '미래'],
            y: [y[y.length - 1], data.nextVal],
            mode: 'lines+markers',
            name: '예언된 미래',
            line: { color: '#fbbf24', width: 3, dash: 'dot' },
            marker: { size: 10, symbol: 'star', color: '#fbbf24' },
            type: 'scatter'
          });
        }
      } else if (chartType === 'bar') {
        // 막대 그래프
        traces.push({
          x,
          y,
          type: 'bar',
          name: '현재 기록',
          marker: { color: '#c084fc' }
        });
        
        // 미래 예측 막대
        if (data.nextVal !== undefined) {
          traces.push({
            x: ['미래'],
            y: [data.nextVal],
            type: 'bar',
            name: '예언된 미래',
            marker: { color: '#fbbf24' }
          });
        }
      } else if (chartType === 'pie') {
        // 원그래프
        const total = y.reduce((sum, val) => sum + val, 0);
        const pieData = x.map((label, i) => ({
          labels: label,
          values: y[i],
          text: `${label}: ${y[i]} (${((y[i] / total) * 100).toFixed(1)}%)`,
          textinfo: 'label+percent'
        }));
        
        traces.push({
          labels: x,
          values: y,
          type: 'pie',
          name: '현재 기록',
          marker: {
            colors: ['#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87']
          },
          textinfo: 'label+percent',
          hovertemplate: '<b>%{label}</b><br>값: %{value}<br>비율: %{percent}<extra></extra>'
        });
      } else if (chartType === 'pictograph') {
        // 그림그래프는 막대 그래프로 대체 (Plotly에서 직접 지원하지 않음)
        // 아이콘을 사용한 막대 그래프로 표현
        traces.push({
          x,
          y,
          type: 'bar',
          name: '현재 기록',
          marker: {
            color: '#c084fc',
            pattern: {
              shape: 'x',
              fillmode: 'overlay'
            }
          }
        });
      }
      
      Plotly.newPlot(
        div,
        traces,
        {
          ...layout,
          title: { text: data.title, font: { size: 18, color: '#fff' } }
        }
      );
    } else {
      // 상관관계 산점도
      Plotly.newPlot(
        div,
        [
          {
            x: data.dataset1.map((d) => d.value),
            y: data.dataset2.map((d) => d.value),
            mode: 'markers',
            type: 'scatter',
            name: '데이터 포인트',
            marker: {
              size: 12,
              color: data.dataset1.map((_, i) => i),
              colorscale: 'Viridis'
            }
          }
        ],
        {
          ...layout,
          title: { text: '두 재료의 관계 확인', font: { size: 16, color: '#fff' } },
          xaxis: { title: data.file1, color: '#a78bfa' },
          yaxis: { title: data.file2, color: '#a78bfa' }
        }
      );
    }
  }, [data, chartType, plotlyLoaded, Plotly]);

  return null;
};

export default ChartRender;


