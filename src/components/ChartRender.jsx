import React, { useEffect, useRef } from 'react';

const ChartRender = ({ data, chartType = 'line', chartDivId = 'chart-div', onRenderingChange }) => {
  const chartInstanceRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || !window.Chart) {
      if (onRenderingChange) onRenderingChange(false);
      return;
    }

    // 기존 차트 인스턴스 제거
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const canvas = document.getElementById(chartDivId);
    if (!canvas) {
      console.warn(`Canvas를 찾을 수 없음: ${chartDivId}`);
      if (onRenderingChange) onRenderingChange(false);
      return;
    }

    if (onRenderingChange) onRenderingChange(true);

    // 데이터 추출 (HTML 코드와 동일한 방식)
    let labels = [];
    let values = [];
    let label = '';

    if (data.type === 'multi-dataset') {
      // multi-dataset 타입
      const dataset = data.dataset || [];
      labels = dataset.map(d => d.year || d.label || '');
      values = dataset.map(d => d.value || 0);
      label = data.yLabel || '수치';
    } else if (data.type === 'single') {
      // single 타입
      const dataset = data.dataset || [];
      labels = dataset.map(d => d.year || d.label || '');
      values = dataset.map(d => d.value || 0);
      label = data.yLabel || '수치';
    } else {
      if (onRenderingChange) onRenderingChange(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (onRenderingChange) onRenderingChange(false);
      return;
    }

    // HTML 코드와 동일한 설정
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: true, position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: false, grid: { color: '#f3f4f6' } },
        x: { grid: { display: false } }
      }
    };

    if (chartType === 'bar') {
      // 막대 그래프 (HTML 코드와 동일)
      chartInstanceRef.current = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: label,
            data: values,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderRadius: 8,
            borderWidth: 0
          }]
        },
        options: commonOptions
      });
    } else if (chartType === 'line') {
      // 꺾은선 그래프 (HTML 코드와 동일)
      chartInstanceRef.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: label,
            data: values,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 8,
            fill: true,
            tension: 0.4
          }]
        },
        options: commonOptions
      });
    }

    if (onRenderingChange) onRenderingChange(false);
  }, [data, chartType, chartDivId, onRenderingChange]);

  // 컴포넌트 언마운트 시 차트 정리
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <canvas 
      id={chartDivId}
      ref={canvasRef}
      className="chart-container"
    />
  );
};

export default ChartRender;
