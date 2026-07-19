package perfmetrics

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestClassifyGroupStatus(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		requestCount   int64
		successCount   int64
		wantStatus     string
		wantRateNil    bool
		wantRateApprox float64
	}{
		{
			name:         "no samples is observing",
			requestCount: 0,
			successCount: 0,
			wantStatus:   GroupStatusObserving,
			wantRateNil:  true,
		},
		{
			name:           "perfect success is healthy",
			requestCount:   10,
			successCount:   10,
			wantStatus:     GroupStatusHealthy,
			wantRateApprox: 100,
		},
		{
			name:           "90 percent is healthy",
			requestCount:   10,
			successCount:   9,
			wantStatus:     GroupStatusHealthy,
			wantRateApprox: 90,
		},
		{
			name:           "half success is slow",
			requestCount:   10,
			successCount:   5,
			wantStatus:     GroupStatusSlow,
			wantRateApprox: 50,
		},
		{
			name:           "below half is down",
			requestCount:   10,
			successCount:   4,
			wantStatus:     GroupStatusDown,
			wantRateApprox: 40,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			status, rate, count := classifyGroupStatus(counters{
				requestCount: tt.requestCount,
				successCount: tt.successCount,
			})
			assert.Equal(t, tt.wantStatus, status)
			assert.Equal(t, tt.requestCount, count)
			if tt.wantRateNil {
				assert.Nil(t, rate)
				return
			}
			require.NotNil(t, rate)
			assert.InDelta(t, tt.wantRateApprox, *rate, 0.01)
		})
	}
}

func TestAggregateGroupStatus(t *testing.T) {
	t.Parallel()

	assert.Equal(t, GroupStatusObserving, aggregateGroupStatus(nil))
	assert.Equal(t, GroupStatusObserving, aggregateGroupStatus([]GroupStatusModel{}))

	// Worst status wins (down > slow > healthy > observing).
	assert.Equal(t, GroupStatusDown, aggregateGroupStatus([]GroupStatusModel{
		{Status: GroupStatusHealthy},
		{Status: GroupStatusDown},
		{Status: GroupStatusSlow},
	}))
	assert.Equal(t, GroupStatusSlow, aggregateGroupStatus([]GroupStatusModel{
		{Status: GroupStatusHealthy},
		{Status: GroupStatusSlow},
		{Status: GroupStatusObserving},
	}))
	assert.Equal(t, GroupStatusHealthy, aggregateGroupStatus([]GroupStatusModel{
		{Status: GroupStatusHealthy},
		{Status: GroupStatusObserving},
	}))
}

func TestAlignBucket(t *testing.T) {
	t.Parallel()

	assert.Equal(t, int64(0), alignBucket(1799, 1800))
	assert.Equal(t, int64(1800), alignBucket(1800, 1800))
	assert.Equal(t, int64(1800), alignBucket(3599, 1800))
	assert.Equal(t, int64(42), alignBucket(42, 0))
}

func TestQueryGroupStatusEmptyGroups(t *testing.T) {
	t.Parallel()

	result, err := QueryGroupStatus(nil)
	require.NoError(t, err)
	assert.Empty(t, result)

	result, err = QueryGroupStatus([]string{})
	require.NoError(t, err)
	assert.Empty(t, result)
}
