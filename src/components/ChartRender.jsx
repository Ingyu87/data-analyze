import React, { useEffect, useState } from 'react';

const ChartRender = ({ data, chartType = 'line', chartDivId = 'chart-div', onRenderingChange }) => {
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const [Plotly, setPlotly] = useState(null);
  const [isRendering, setIsRendering] = useState(false);

  // Lazy load Plotly
  useEffect(() => {
    if (plotlyLoaded && Plotly) return; // 이미 로드됨
    
    let cancelled = false;
    if (onRenderingChange) onRenderingChange(true);
    
    import('plotly.js').then((plotlyModule) => {
      if (cancelled) return;
      
      // Plotly 모듈 구조 확인
      let plotly = null;
      if (plotlyModule.default) {
        plotly = plotlyModule.default;
      } else if (plotlyModule.newPlot) {
        plotly = plotlyModule;
      } else if (typeof plotlyModule === 'object' && plotlyModule.Plotly) {
        plotly = plotlyModule.Plotly;
      }
      
      if (plotly && typeof plotly.newPlot === 'function') {
        setPlotly(plotly);
        setPlotlyLoaded(true);
        if (onRenderingChange && !data) onRenderingChange(false);
      } else {
        console.error('Plotly module structure invalid:', plotlyModule);
        if (onRenderingChange) onRenderingChange(false);
      }
    }).catch((error) => {
      console.error('Failed to load Plotly:', error);
      if (onRenderingChange) onRenderingChange(false);
    });
    
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!plotlyLoaded || !Plotly || !data) {
      if (onRenderingChange) onRenderingChange(false);
      return;
    }
    
    const div = document.getElementById(chartDivId);
    if (!div) {
      console.warn(`Chart div not found: ${chartDivId}`);
      if (onRenderingChange) onRenderingChange(false);
      return;
    }

    // Cleanup flag to prevent React error #130
    let isMounted = true;
    let plotlyInstance = null;
    
    // 렌더링 시작
    setIsRendering(true);
    if (onRenderingChange) onRenderingChange(true);

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#e9d5ff' },
      xaxis: { 
        showgrid: false, 
        color: '#a78bfa',
        title: data.xLabel || '항목',
        titlefont: { size: 14, color: '#e9d5ff' }
      },
      yaxis: { 
        showgrid: true, 
        gridcolor: '#4c1d95', 
        color: '#a78bfa',
        title: data.yLabel || '값',
        titlefont: { size: 14, color: '#e9d5ff' }
      },
      margin: { t: 40, r: 20, l: 60, b: 60 }
    };

    if (data.type === 'single') {
      if (!data.dataset || data.dataset.length === 0) {
        console.warn('No dataset available for single chart');
        return;
      }

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
      
      if (isMounted) {
        // 기존 그래프 제거
        try {
          Plotly.purge(div);
        } catch (e) {
          // 무시
        }
        
        console.log('Rendering chart with', traces.length, 'traces,', x.length, 'data points');
        Plotly.newPlot(
          div,
          traces,
          {
            ...layout,
            title: { text: data.title, font: { size: 18, color: '#fff' } }
          }
        ).then(() => {
          if (isMounted) {
            plotlyInstance = div;
            setIsRendering(false);
            if (onRenderingChange) onRenderingChange(false);
            console.log('Chart rendered successfully');
          }
        }).catch((error) => {
          console.error('Plotly rendering error:', error);
          if (isMounted) {
            setIsRendering(false);
            if (onRenderingChange) onRenderingChange(false);
          }
        });
      }
    } else if (data.type === 'multi') {
      // 상관관계 산점도
      if (!data.dataset1 || !data.dataset2 || data.dataset1.length === 0 || data.dataset2.length === 0) {
        console.warn('Multi dataset missing or empty');
        return;
      }

      if (isMounted) {
        // 기존 그래프 제거
        try {
          Plotly.purge(div);
        } catch (e) {
          // 무시
        }
        
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
            title: { text: '두 데이터의 관계 확인', font: { size: 16, color: '#fff' } },
            xaxis: { ...layout.xaxis, title: data.file1 },
            yaxis: { ...layout.yaxis, title: data.file2 }
          }
        ).then(() => {
          if (isMounted) {
            plotlyInstance = div;
            setIsRendering(false);
            if (onRenderingChange) onRenderingChange(false);
          }
        }).catch((error) => {
          console.error('Plotly rendering error:', error);
          if (isMounted) {
            setIsRendering(false);
            if (onRenderingChange) onRenderingChange(false);
          }
        });
      }
    }

    // Cleanup function
    return () => {
      isMounted = false;
      setIsRendering(false);
      if (onRenderingChange) onRenderingChange(false);
      if (div && Plotly) {
        try {
          Plotly.purge(div);
        } catch (error) {
          console.error('Error purging chart:', error);
        }
      }
    };
  }, [data, chartType, plotlyLoaded, Plotly, chartDivId, onRenderingChange]);

  return null;
};

export default ChartRender;


