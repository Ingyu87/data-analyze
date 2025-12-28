import React, { useEffect, useState, useRef } from 'react';

const ChartRender = ({ data, chartType = 'line', chartDivId = 'chart-div', onRenderingChange }) => {
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);
  const plotlyRef = useRef(null);
  const mountedRef = useRef(true);
  const renderAttemptRef = useRef(0);

  // Plotly 로드
  useEffect(() => {
    mountedRef.current = true;
    
    const loadPlotly = async () => {
      if (plotlyRef.current) {
        setPlotlyLoaded(true);
        return;
      }
      
      if (onRenderingChange) onRenderingChange(true);
      
      try {
        // plotly.js를 동적으로 import
        const plotlyModule = await import('plotly.js');
        
        let plotly = null;
        
        // plotly.js는 기본적으로 default export가 없고, 직접 사용
        // 여러 가능한 export 구조 확인
        if (plotlyModule.default) {
          // default가 있으면 확인
          if (typeof plotlyModule.default.newPlot === 'function') {
            plotly = plotlyModule.default;
          } else if (plotlyModule.default.Plotly && typeof plotlyModule.default.Plotly.newPlot === 'function') {
            plotly = plotlyModule.default.Plotly;
          }
        }
        
        // default가 없거나 실패하면 직접 확인
        if (!plotly) {
          if (typeof plotlyModule.newPlot === 'function') {
            plotly = plotlyModule;
          } else if (plotlyModule.Plotly && typeof plotlyModule.Plotly.newPlot === 'function') {
            plotly = plotlyModule.Plotly;
          }
        }
        
        // window.Plotly 확인 (일부 빌드에서는 window에 할당됨)
        if (!plotly && window.Plotly && typeof window.Plotly.newPlot === 'function') {
          plotly = window.Plotly;
        }
        
        if (plotly && typeof plotly.newPlot === 'function') {
          plotlyRef.current = plotly;
          if (mountedRef.current) {
            setPlotlyLoaded(true);
            console.log('Plotly 로드 완료', typeof plotly);
          }
        } else {
          console.error('Plotly 모듈 구조 오류:', {
            hasDefault: !!plotlyModule.default,
            hasNewPlot: typeof plotlyModule.newPlot,
            hasPlotly: !!plotlyModule.Plotly,
            hasWindowPlotly: !!window.Plotly,
            keys: Object.keys(plotlyModule)
          });
          // CDN으로 폴백 시도
          loadPlotlyFromCDN();
        }
      } catch (error) {
        console.error('Plotly 로드 실패:', error);
        // CDN으로 폴백 시도
        loadPlotlyFromCDN();
      }
      
      // CDN 로드 함수
      function loadPlotlyFromCDN() {
        if (typeof window !== 'undefined' && !window.Plotly) {
          const script = document.createElement('script');
          script.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
          script.onload = () => {
            if (window.Plotly && typeof window.Plotly.newPlot === 'function') {
              plotlyRef.current = window.Plotly;
              if (mountedRef.current) {
                setPlotlyLoaded(true);
                console.log('Plotly CDN 로드 완료');
                if (onRenderingChange) onRenderingChange(false);
              }
            } else {
              console.error('Plotly CDN 로드 후에도 newPlot 없음');
              if (onRenderingChange) onRenderingChange(false);
            }
          };
          script.onerror = () => {
            console.error('Plotly CDN 로드 실패');
            if (onRenderingChange) onRenderingChange(false);
          };
          document.head.appendChild(script);
        } else if (window.Plotly && typeof window.Plotly.newPlot === 'function') {
          plotlyRef.current = window.Plotly;
          if (mountedRef.current) {
            setPlotlyLoaded(true);
            console.log('기존 window.Plotly 사용');
            if (onRenderingChange) onRenderingChange(false);
          }
        } else if (onRenderingChange) {
          onRenderingChange(false);
        }
      }
    };
    
    loadPlotly();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 그래프 렌더링
  useEffect(() => {
    if (!plotlyLoaded || !plotlyRef.current || !data) {
      return;
    }
    
    const Plotly = plotlyRef.current;
    
    // div가 준비될 때까지 대기하는 함수
    const renderChart = () => {
      const div = document.getElementById(chartDivId);
      
      if (!div) {
        renderAttemptRef.current += 1;
        if (renderAttemptRef.current < 10) {
          // 최대 10번 재시도 (1초)
          setTimeout(renderChart, 100);
          return;
        }
        console.warn(`차트 div를 찾을 수 없음: ${chartDivId}`);
        if (onRenderingChange) onRenderingChange(false);
        return;
      }
      
      // 렌더링 시작
      if (onRenderingChange) onRenderingChange(true);

      const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e9d5ff', family: 'Pretendard, -apple-system, sans-serif' },
        xaxis: { 
          showgrid: false, 
          color: '#a78bfa',
          title: { text: data.xLabel || '항목', font: { size: 12, color: '#e9d5ff' } },
          tickfont: { size: 10 }
        },
        yaxis: { 
          showgrid: true, 
          gridcolor: '#4c1d95', 
          color: '#a78bfa',
          title: { text: data.yLabel || '값', font: { size: 12, color: '#e9d5ff' } },
          tickfont: { size: 10 }
        },
        margin: { t: 50, r: 20, l: 60, b: 80 },
        showlegend: true,
        legend: { 
          orientation: 'h', 
          y: -0.2,
          font: { size: 10 }
        }
      };

      const config = {
        responsive: true,
        displayModeBar: false
      };

      // 기존 그래프 정리
      try {
        Plotly.purge(div);
      } catch (e) {
        // 무시
      }

      if (!data || !data.type) {
        console.error('ChartRender: data 또는 data.type이 없습니다:', data);
        if (onRenderingChange) onRenderingChange(false);
        return;
      }
      
      if (data.type === 'single') {
        if (!data.dataset || data.dataset.length === 0) {
          console.warn('단일 차트용 데이터셋 없음');
          if (onRenderingChange) onRenderingChange(false);
          return;
        }

        const labels = data.dataset.map((d) => d.originalLabel || d.label || '');
        const values = data.dataset.map((d) => {
          const val = d.value;
          return val !== undefined && val !== null && !isNaN(val) ? val : 0;
        });
        
        const traces = [];
        
        if (chartType === 'line') {
          // 꺾은선 그래프
          traces.push({
            x: labels,
            y: values,
            mode: 'lines+markers+text',
            name: '데이터',
            line: { color: '#c084fc', width: 3 },
            marker: { size: 10, color: '#c084fc' },
            text: values.map(v => v.toLocaleString()),
            textposition: 'top center',
            textfont: { size: 9, color: '#fbbf24' },
            type: 'scatter',
            hovertemplate: '<b>%{x}</b><br>값: %{y:,.0f}<extra></extra>'
          });
          
          // 미래 예측선
          if (data.nextVal !== undefined && !isNaN(data.nextVal)) {
            traces.push({
              x: [labels[labels.length - 1], '다음 예측'],
              y: [values[values.length - 1], data.nextVal],
              mode: 'lines+markers+text',
              name: '예측',
              line: { color: '#fbbf24', width: 3, dash: 'dot' },
              marker: { size: 12, symbol: 'star', color: '#fbbf24' },
              text: ['', data.nextVal.toLocaleString()],
              textposition: 'top center',
              textfont: { size: 10, color: '#fbbf24' },
              type: 'scatter',
              hovertemplate: '<b>%{x}</b><br>예측값: %{y:,.0f}<extra></extra>'
            });
          }
        } else if (chartType === 'bar') {
          // 막대 그래프
          traces.push({
            x: labels,
            y: values,
            type: 'bar',
            name: '데이터',
            marker: { 
              color: values.map((_, i) => {
                const colors = ['#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#d946ef', '#ec4899'];
                return colors[i % colors.length];
              })
            },
            text: values.map(v => v.toLocaleString()),
            textposition: 'outside',
            textfont: { size: 10, color: '#fbbf24' },
            hovertemplate: '<b>%{x}</b><br>값: %{y:,.0f}<extra></extra>'
          });
          
          // 미래 예측 막대
          if (data.nextVal !== undefined && !isNaN(data.nextVal)) {
            traces.push({
              x: ['다음 예측'],
              y: [data.nextVal],
              type: 'bar',
              name: '예측',
              marker: { color: '#fbbf24' },
              text: [data.nextVal.toLocaleString()],
              textposition: 'outside',
              textfont: { size: 10, color: '#fbbf24' },
              hovertemplate: '<b>다음 예측</b><br>예측값: %{y:,.0f}<extra></extra>'
            });
          }
        } else if (chartType === 'pie') {
          // 원그래프
          traces.push({
            labels: labels,
            values: values,
            type: 'pie',
            name: '데이터',
            marker: {
              colors: ['#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#d946ef', '#ec4899']
            },
            textinfo: 'label+percent',
            textposition: 'inside',
            textfont: { size: 11, color: '#fff' },
            hovertemplate: '<b>%{label}</b><br>값: %{value:,.0f}<br>비율: %{percent}<extra></extra>',
            hole: 0.3
          });
          
          // 원그래프는 레이아웃 수정
          layout.showlegend = true;
          layout.legend = { orientation: 'v', x: 1, y: 0.5, font: { size: 10 } };
        } else if (chartType === 'pictograph') {
          // 그림그래프 (막대 그래프로 시각화하되 패턴 사용)
          traces.push({
            x: labels,
            y: values,
            type: 'bar',
            name: '데이터',
            marker: { 
              color: '#c084fc',
              pattern: {
                shape: '/',
                solidity: 0.5
              }
            },
            text: values.map(v => `${v.toLocaleString()} 🔹`),
            textposition: 'outside',
            textfont: { size: 10, color: '#fbbf24' },
            hovertemplate: '<b>%{x}</b><br>값: %{y:,.0f}<extra></extra>'
          });
        }
        
        console.log(`차트 렌더링: ${traces.length}개 trace, ${labels.length}개 데이터 포인트, 타입: ${chartType}`);
        
        Plotly.newPlot(div, traces, {
          ...layout,
          title: { 
            text: data.title || '데이터 시각화', 
            font: { size: 16, color: '#fff' },
            y: 0.95
          }
        }, config).then(() => {
          console.log('차트 렌더링 완료');
          if (onRenderingChange) onRenderingChange(false);
        }).catch((error) => {
          console.error('Plotly 렌더링 오류:', error);
          if (onRenderingChange) onRenderingChange(false);
        });
        
      } else if (data.type === 'multi-series') {
        // 멀티 시리즈 그래프 (여러 지표를 하나의 그래프에 표시)
        if (!data.series || data.series.length === 0) {
          console.warn('멀티 시리즈 데이터 없음');
          if (onRenderingChange) onRenderingChange(false);
          return;
        }

        const years = data.years || [];
        const colors = ['#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#d946ef', '#ec4899', '#fbbf24', '#10b981'];
        const traces = [];

        for (let i = 0; i < data.series.length; i++) {
          const series = data.series[i];
          const seriesValues = years.map(year => {
            const point = series.data.find(p => p.year === year);
            const val = point ? point.value : null;
            return (val !== undefined && val !== null && !isNaN(val)) ? val : null;
          });

          if (chartType === 'line') {
            traces.push({
              x: years,
              y: seriesValues,
              mode: 'lines+markers+text',
              name: series.name,
              line: { color: colors[i % colors.length], width: 3 },
              marker: { size: 10, color: colors[i % colors.length] },
              text: seriesValues.map(v => (v !== null && v !== undefined && !isNaN(v)) ? v.toLocaleString() : ''),
              textposition: 'top center',
              textfont: { size: 9, color: colors[i % colors.length] },
              type: 'scatter',
              hovertemplate: `<b>${series.name}</b><br>연도: %{x}<br>값: %{y:,.0f}<extra></extra>`
            });
          } else if (chartType === 'bar') {
            traces.push({
              x: years,
              y: seriesValues,
              type: 'bar',
              name: series.name,
              marker: { color: colors[i % colors.length] },
              text: seriesValues.map(v => (v !== null && v !== undefined && !isNaN(v)) ? v.toLocaleString() : ''),
              textposition: 'outside',
              textfont: { size: 10, color: colors[i % colors.length] },
              hovertemplate: `<b>${series.name}</b><br>연도: %{x}<br>값: %{y:,.0f}<extra></extra>`
            });
          }
        }

        console.log(`멀티 시리즈 차트 렌더링: ${traces.length}개 시리즈, ${years.length}개 연도, 타입: ${chartType}`);

        Plotly.newPlot(div, traces, {
          ...layout,
          xaxis: { ...layout.xaxis, title: { text: data.xLabel || '연도', font: { size: 12, color: '#e9d5ff' } } },
          yaxis: { ...layout.yaxis, title: { text: data.yLabel || '값', font: { size: 12, color: '#e9d5ff' } } },
          title: { 
            text: data.name || '데이터 시각화', 
            font: { size: 16, color: '#fff' },
            y: 0.95
          }
        }, config).then(() => {
          console.log('멀티 시리즈 차트 렌더링 완료');
          if (onRenderingChange) onRenderingChange(false);
        }).catch((error) => {
          console.error('Plotly 렌더링 오류:', error);
          if (onRenderingChange) onRenderingChange(false);
        });
      } else if (data.type === 'multi') {
        // 상관관계 산점도
        if (!data.dataset1 || !data.dataset2 || data.dataset1.length === 0 || data.dataset2.length === 0) {
          console.warn('다중 데이터셋 없음');
          if (onRenderingChange) onRenderingChange(false);
          return;
        }

        const xValues = data.dataset1.map((d) => d.value);
        const yValues = data.dataset2.map((d) => d.value);
        const labels = data.dataset1.map((d, i) => d.label || data.dataset2[i]?.label || `데이터 ${i+1}`);
        
        Plotly.newPlot(div, [{
          x: xValues,
          y: yValues,
          mode: 'markers+text',
          type: 'scatter',
          name: '데이터 포인트',
          text: labels,
          textposition: 'top center',
          textfont: { size: 9, color: '#e9d5ff' },
          marker: {
            size: 14,
            color: xValues.map((_, i) => i),
            colorscale: 'Viridis',
            showscale: true,
            colorbar: { title: '순서', tickfont: { color: '#e9d5ff' } }
          },
          hovertemplate: '<b>%{text}</b><br>' + (data.file1 || 'X') + ': %{x:,.0f}<br>' + (data.file2 || 'Y') + ': %{y:,.0f}<extra></extra>'
        }], {
          ...layout,
          title: { 
            text: '두 데이터의 관계', 
            font: { size: 16, color: '#fff' },
            y: 0.95
          },
          xaxis: { ...layout.xaxis, title: { text: data.file1 || 'X축', font: { size: 12, color: '#e9d5ff' } } },
          yaxis: { ...layout.yaxis, title: { text: data.file2 || 'Y축', font: { size: 12, color: '#e9d5ff' } } }
        }, config).then(() => {
          console.log('상관관계 차트 렌더링 완료');
          if (onRenderingChange) onRenderingChange(false);
        }).catch((error) => {
          console.error('Plotly 렌더링 오류:', error);
          if (onRenderingChange) onRenderingChange(false);
        });
      }
    };
    
    // 렌더링 시도 초기화 후 시작
    renderAttemptRef.current = 0;
    
    // 약간의 지연 후 렌더링 시작 (DOM이 준비되도록)
    const timeoutId = setTimeout(renderChart, 50);
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      const div = document.getElementById(chartDivId);
      if (div && plotlyRef.current) {
        try {
          plotlyRef.current.purge(div);
        } catch (e) {
          // 무시
        }
      }
    };
  }, [data, chartType, plotlyLoaded, chartDivId, onRenderingChange]);

  return null;
};

export default ChartRender;
