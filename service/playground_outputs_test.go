package service

import (
	"context"
	"encoding/base64"
	"io"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service/storage"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPersistPlaygroundOutputDataURL(t *testing.T) {
	require.NoError(t, model.DB.AutoMigrate(&model.PlaygroundAsset{}))
	t.Cleanup(func() { model.DB.Exec("DELETE FROM playground_assets") })

	root := t.TempDir()
	t.Setenv("STORAGE_BACKEND", "local")
	t.Setenv("PLAYGROUND_ASSETS_DIR", root)
	storage.Reset()
	t.Cleanup(storage.Reset)

	png := []byte{
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
		0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
	}
	dataURL := "data:image/png;base64," + base64.StdEncoding.EncodeToString(png)

	asset, err := PersistPlaygroundOutput(context.Background(), 99, "image", dataURL)
	require.NoError(t, err)
	require.NotNil(t, asset)
	assert.Equal(t, "image", asset.Kind)
	assert.Equal(t, "image/png", asset.Mime)
	assert.Equal(t, "local", asset.Backend)
	assert.True(t, strings.HasPrefix(asset.StorageKey, "outputs/99/"), "key: %s", asset.StorageKey)
	assert.NotZero(t, asset.Id)

	_, body, err := OpenPlaygroundAssetContent(context.Background(), asset.StorageKey, 0)
	require.NoError(t, err)
	got, err := io.ReadAll(body)
	require.NoError(t, body.Close())
	require.NoError(t, err)
	assert.Equal(t, png, got)
}

func TestPersistPlaygroundOutputNotPersistable(t *testing.T) {
	root := t.TempDir()
	t.Setenv("STORAGE_BACKEND", "local")
	t.Setenv("PLAYGROUND_ASSETS_DIR", root)
	storage.Reset()
	t.Cleanup(storage.Reset)

	for _, ref := range []string{"", "   ", "/api/playground/assets/1/content", "ftp://example.com/x.png"} {
		asset, err := PersistPlaygroundOutput(context.Background(), 1, "image", ref)
		require.NoError(t, err, "ref=%q", ref)
		assert.Nil(t, asset, "ref=%q", ref)
	}
}
