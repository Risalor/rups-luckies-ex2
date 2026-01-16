using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class Dictionary : UIObject
{
    public static Dictionary Instance;
    public GameObject Dict;
    public DictionaryEntry entryPrefab;
    public Transform content;
    public AudioClip OpenSound;
    private AudioSource audioSource;
    private Animator anim = null;
    private bool DictToggle = true;
    private readonly Dictionary<string, DictionaryEntry> _entries = new();
    public ScrollRect scrollRect;
    string wordToFind = "";
    public TMPro.TMP_InputField wordInputField;

    public bool IsOpen => !DictToggle;

    public void Awake()
    {
        this.SetupSingleton(ref Instance);

        gameObject.SetActive(true);

        anim = Dict.GetComponent<Animator>();
        audioSource = Dict.GetComponent<AudioSource>();
    }

    private void Start()
    {
        foreach (var child in content.GetComponentsInChildren<DictionaryEntry>())
            Destroy(child.gameObject);

        foreach (var word in WordManager.Instance.wordDB)
        {
            var entry = Instantiate(entryPrefab, content);
            entry.Setup(word);
            _entries[word.slo_word.ToLower().Trim()] = entry;
            _entries[word.eng_word.ToLower().Trim()] = entry;
        }
    }

    public void OnDictionaryToggle()
    {
        if (anim == null)
        {
            anim = Dict.GetComponent<Animator>();
        }

        if (audioSource == null)
        {
            audioSource = Dict.GetComponent<AudioSource>();
        }

        if (DictToggle)
            anim.SetTrigger("Appear");
        else
            anim.SetTrigger("Hide");

        audioSource.clip = OpenSound;
        audioSource.Play();

        DictToggle = !DictToggle;
    }

    public void ScrollToWord()
    {
        wordToFind = wordInputField.text.ToLower().Trim();

        if (_entries.TryGetValue(wordToFind, out DictionaryEntry entry))
            ScrollToEntry(entry.transform as RectTransform);
    }

    public void ScrollToEntry(RectTransform targetEntry)
    {
        if (scrollRect == null || targetEntry == null) return;

        StartCoroutine(ScrollToEntryCoroutine(targetEntry));
    }

    private System.Collections.IEnumerator ScrollToEntryCoroutine(RectTransform targetEntry)
    {
        yield return new WaitForEndOfFrame();

        Canvas.ForceUpdateCanvases();

        Vector2 viewportLocalPosition = scrollRect.viewport.localPosition;
        Vector2 childLocalPosition = targetEntry.localPosition;
        Vector2 result = new Vector2(
            0,
            -childLocalPosition.y - (targetEntry.rect.height / 2)
        );

        scrollRect.content.localPosition = result;

        audioSource.clip = OpenSound;
        audioSource.Play();
    }
}
