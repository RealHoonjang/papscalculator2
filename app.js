// 전역 변수로 PAPS_DATA 사용 가능 여부 확인
function checkPAPSData() {
    if (typeof window.PAPS_DATA === 'undefined') {
        console.error('PAPS_DATA가 정의되지 않았습니다.');
        return false;
    }
    return true;
}

// 전역 변수
let papsChart = null;
const factors = ['심폐지구력', '유연성', '근력근지구력', '순발력', '비만'];
let currentResults = {
    심폐지구력: { 점수: 0, 등급: '-' },
    유연성: { 점수: 0, 등급: '-' },
    근력근지구력: { 점수: 0, 등급: '-' },
    순발력: { 점수: 0, 등급: '-' },
    비만: { 점수: 0, 등급: '-' }
};

// PAPS_DATA 로딩 확인
function waitForPAPSData(callback, maxAttempts = 10) {
    let attempts = 0;
    
    function checkPAPSData() {
        attempts++;
        if (typeof PAPS_DATA !== 'undefined') {
            callback();
        } else if (attempts < maxAttempts) {
            setTimeout(checkPAPSData, 100);
        } else {
            console.error('PAPS_DATA 로딩 실패');
        }
    }
    
    checkPAPSData();
}

// 스크립트 로딩 확인
function checkScriptsLoaded() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined' && typeof PAPS_DATA !== 'undefined') {
            resolve();
        } else {
            reject(new Error('필요한 스크립트가 로드되지 않았습니다.'));
        }
    });
}

// 페이지 로드 완료 시 실행
window.onload = function() {
    console.log('페이지 로드됨');
    
    checkScriptsLoaded()
        .then(() => {
            try {
                initializeChart();
                setupEventListeners();
            } catch (error) {
                console.error('초기화 중 오류 발생:', error);
            }
        })
        .catch(error => {
            console.error('스크립트 로딩 실패:', error);
        });
};

// 결과 확인 버튼 클릭 이벤트
const 계산버튼 = document.getElementById('계산버튼');

계산버튼.addEventListener('click', function() {
    console.log('버튼 클릭됨');
    
    // 입력값 가져오기 및 공백 제거
    const 체력요인 = document.getElementById('체력요인').value.trim();
    const 평가종목 = document.getElementById('평가종목').value.trim();
    const 학년 = document.getElementById('학년').value.trim();
    const 성별 = document.getElementById('성별').value.trim();
    const 학교과정 = document.getElementById('학교과정').value.trim();
    const 기록 = parseFloat(document.getElementById('기록').value);

    console.log('입력값:', {체력요인, 평가종목, 학년, 성별, 학교과정, 기록});

    // 입력값 검증
    if (!체력요인 || !평가종목 || !학년 || !성별 || !학교과정 || isNaN(기록)) {
        alert('모든 항목을 입력해주세요.');
        return;
    }

    // 평가 결과 찾기
    const 평가결과 = PAPS_DATA.평가기준.find(item => {
        // 모든 문자열 값에 trim() 적용
        const itemMatch = 
            item.체력요인.trim() === 체력요인 &&
            item.평가종목.trim() === 평가종목 &&
            item.학년.trim() === 학년 &&
            item.성별.trim() === 성별 &&
            item.학교과정.trim() === 학교과정;

        if (!itemMatch) return false;

        // 기록 범위 확인
        const [최소값, 최대값] = item.기록.split('~').map(str => parseFloat(str.trim()));
        const 기록범위일치 = 기록 >= 최소값 && 기록 <= 최대값;

        console.log('조건 비교:', {
            체력요인일치: item.체력요인.trim() === 체력요인,
            평가종목일치: item.평가종목.trim() === 평가종목,
            학년일치: item.학년.trim() === 학년,
            성별일치: item.성별.trim() === 성별,
            학교과정일치: item.학교과정.trim() === 학교과정,
            기록범위: `${최소값} ~ ${최대값}`,
            입력기록: 기록,
            기록범위일치: 기록범위일치
        });

        return itemMatch && 기록범위일치;
    });

    console.log('찾은 평가결과:', 평가결과);

    // 결과 표시
    const 등급결과 = document.getElementById('등급결과');
    const 점수결과 = document.getElementById('점수결과');

    if (평가결과) {
        등급결과.textContent = 평가결과.등급;
        점수결과.textContent = 평가결과.점수;
        console.log('결과 표시:', 평가결과.등급, 평가결과.점수);
    } else {
        등급결과.textContent = '해당 없음';
        점수결과.textContent = '-';
        console.log('해당하는 결과를 찾을 수 없음');
    }
});

// 체력요인 선택 이벤트
document.getElementById('체력요인').addEventListener('change', function() {
    const 선택된체력요인 = this.value;
    const 평가종목Select = document.getElementById('평가종목');
    const optgroups = 평가종목Select.getElementsByTagName('optgroup');
    
    for(let optgroup of optgroups) {
        optgroup.style.display = 'none';
        const options = optgroup.getElementsByTagName('option');
        for(let option of options) {
            option.style.display = 'none';
        }
    }
    
    if(선택된체력요인) {
        const selectedOptgroup = 평가종목Select.querySelector(`optgroup[label="${선택된체력요인}"]`);
        if(selectedOptgroup) {
            selectedOptgroup.style.display = '';
            const options = selectedOptgroup.getElementsByTagName('option');
            for(let option of options) {
                option.style.display = '';
            }
        }
    }
    
    평가종목Select.value = '';
});

// 평가종목 업데이트 함수
function updatePapsItems(선택된체력요인) {
    const 평가종목Select = document.getElementById('평가종목');
    평가종목Select.innerHTML = '<option value="">평가종목 선택</option>';
    
    if (선택된체력요인) {
        const 평가종목매핑 = {
            "심폐지구력": ["왕복오래달리기", "스텝검사", "오래달리기-걷기"],
            "유연성": ["앉아윗몸앞으로굽히기", "종합유연성검사"],
            "근력근지구력": ["(무릎대고)팔굽혀펴기", "윗몸말아올리기", "악력"],
            "순발력": ["50m달리기", "제자리멀리뛰기"],
            "비만": ["체질량지수"]
        };
        
        if (평가종목매핑[선택된체력요인]) {
            평가종목매핑[선택된체력요인].forEach(종목 => {
                const option = document.createElement('option');
                option.value = 종목;
                option.textContent = 종목;
                평가종목Select.appendChild(option);
            });
        }
    }
}

// 차트 초기화
function initializeChart() {
    const ctx = document.getElementById('papsChart');
    if (!ctx) {
        console.error('차트 캔버스를 찾을 수 없습니다.');
        return;
    }

    try {
        papsChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: factors,
                datasets: [{
                    label: '체력 평가 결과',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        min: 1,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return (6 - value) + '등급';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const factor = context.chart.data.labels[context.dataIndex];
                                const grade = 6 - context.raw;
                                const score = currentResults[factor].점수;
                                return `${grade}등급 (${score}점)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('차트 생성 중 오류 발생:', error);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 학생 정보 변경 시 모든 결과 초기화
    document.getElementById('학교과정').addEventListener('change', resetAllResults);
    document.getElementById('학년').addEventListener('change', resetAllResults);
    document.getElementById('성별').addEventListener('change', resetAllResults);

    // 각 체력요인별 입력 필드에 이벤트 리스너 추가
    factors.forEach(factor => {
        const select = document.querySelector(`.평가종목[data-factor="${factor}"]`);
        const input = document.querySelector(`.기록[data-factor="${factor}"]`);
        
        select.addEventListener('change', () => calculateResult(factor));
        input.addEventListener('input', () => calculateResult(factor));
    });
}

// 결과 초기화
function resetAllResults() {
    factors.forEach(factor => {
        currentResults[factor] = { 점수: 0, 등급: '-' };
        updateResultDisplay(factor);
    });
    updateChart();
    updateTotalResult();
}

// 개별 결과 계산
function calculateResult(factor) {
    const 학교과정 = document.getElementById('학교과정').value;
    const 학년 = document.getElementById('학년').value;
    const 성별 = document.getElementById('성별').value;
    const 평가종목 = document.querySelector(`.평가종목[data-factor="${factor}"]`).value;
    const 기록 = parseFloat(document.querySelector(`.기록[data-factor="${factor}"]`).value);

    if (!학교과정 || !학년 || !성별 || !평가종목 || isNaN(기록)) {
        currentResults[factor] = { 점수: 0, 등급: '-' };
        updateResultDisplay(factor);
        updateChart();
        updateTotalResult();
        return;
    }

    const 평가결과 = PAPS_DATA.평가기준.find(item => {
        return item.체력요인.trim() === factor &&
               item.평가종목.trim() === 평가종목 &&
               item.학년.trim() === 학년 &&
               item.성별.trim() === 성별 &&
               item.학교과정.trim() === 학교과정 &&
               isInRange(기록, item.기록);
    });

    if (평가결과) {
        currentResults[factor] = {
            점수: parseInt(평가결과.점수),
            등급: 평가결과.등급
        };
    } else {
        currentResults[factor] = { 점수: 0, 등급: '-' };
    }

    updateResultDisplay(factor);
    updateChart();
    updateTotalResult();
}

// 기록 범위 확인
function isInRange(기록, rangeStr) {
    const [min, max] = rangeStr.split('~').map(str => parseFloat(str.trim()));
    return 기록 >= min && 기록 <= max;
}

// 결과 표시 업데이트
function updateResultDisplay(factor) {
    const resultDisplay = document.querySelector(`.input-group[data-factor="${factor}"] .result-display`);
    if (resultDisplay) {
        resultDisplay.querySelector('.점수').textContent = currentResults[factor].점수 + '점';
        resultDisplay.querySelector('.등급').textContent = currentResults[factor].등급;
    }
}

// 차트 업데이트
function updateChart() {
    papsChart.data.datasets[0].data = factors.map(factor => {
        const 등급 = currentResults[factor].등급;
        if (등급 === '-') return 0;
        // 등급을 반대로 변환 (1등급 -> 5점, 5등급 -> 1점)
        const 등급숫자 = parseInt(등급.replace('등급', ''));
        return 6 - 등급숫자; // 6에서 등급을 빼서 반대로 변환
    });
    papsChart.update();
}

// 전체 결과 업데이트
function updateTotalResult() {
    const totalScore = factors.reduce((sum, factor) => sum + currentResults[factor].점수, 0);
    const totalGrade = calculateTotalGrade(totalScore);

    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('total-grade').textContent = totalGrade;
}

// 전체 등급 계산
function calculateTotalGrade(score) {
    if (score >= 80) return '1등급';
    if (score >= 60) return '2등급';
    if (score >= 40) return '3등급';
    if (score >= 20) return '4등급';
    return '5등급';
}
