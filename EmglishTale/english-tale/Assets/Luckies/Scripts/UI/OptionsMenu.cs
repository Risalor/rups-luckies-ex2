using UnityEngine;
using UnityEngine.UI;

public class OptionsMenu : MonoBehaviour
{
    [SerializeField] private Slider masterVolumeSlider;
    private const string MasterVolumeKey = "MasterVolume";

    private void Awake()
    {
        float saved = PlayerPrefs.HasKey(MasterVolumeKey) ? PlayerPrefs.GetFloat(MasterVolumeKey) : 1f;
        if (masterVolumeSlider != null)
        {
            masterVolumeSlider.value = saved;
            masterVolumeSlider.onValueChanged.AddListener(OnVolumeChanged);
        }

        ApplyVolume(saved);
    }

    public void OnVolumeChanged(float value)
    {
        ApplyVolume(value);
        PlayerPrefs.SetFloat(MasterVolumeKey, value);
        PlayerPrefs.Save();
    }

    private void ApplyVolume(float v)
    {
        // for now just global volume
        AudioListener.volume = Mathf.Clamp01(v);
    }

    private void OnDestroy()
    {
        if (masterVolumeSlider != null)
            masterVolumeSlider.onValueChanged.RemoveListener(OnVolumeChanged);
    }
}
