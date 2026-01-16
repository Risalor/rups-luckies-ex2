using UnityEngine;

public class MainMenu : UIObject
{
    public static MainMenu Instance;

    [Header("UI Panels")]
    [SerializeField] private GameObject mainMenuPanel;
    [SerializeField] private GameObject optionsPanel;

    private void Awake()
    {
        this.SetupSingleton(ref Instance);

        HideOptions();
    }

    public void PlayGame()
    {
        this.SmartLog("Play game");
        GameManager.Instance.StartGame();
    }

    public void QuitGame()
    {
        this.SmartLog("Quit game");
        Debug.Log("quit game");
        Application.Quit();
    }

    public void ShowOptions()
    {
        this.SmartLog("Show options");
        mainMenuPanel.SetActive(false);
        optionsPanel.SetActive(true);
    }

    public void HideOptions()
    {
        this.SmartLog("Hide options");
        optionsPanel.SetActive(false);
        mainMenuPanel.SetActive(true);
    }
}
