using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using static UnityEditor.Experimental.GraphView.GraphView;
using Debug = UnityEngine.Debug;
using Random = UnityEngine.Random;

public class QuestionUI : UIObject
{
    public static QuestionUI Instance = null;

    public enum QuestionType { Typing, Matching }

    [Header("Battle Rules")]
    public int totalCorrectRequired = 10;
    private int totalCorrectCount = 0;


    [Header("Common")]
    public TMP_Text questionText;

    [Header("Typing UI")]
    public GameObject TypeAnswerPanel;
    public TMP_InputField answerInput;
    public Image wordImage;
    public Button typingSubmitButton;
    public Button typingNextButton;
    public TMP_Text typingFeedbackText;

    [Header("Matching UI")]
    public GameObject MatchPanel;
    public Image[] imageButtons;     // LEFT side image buttons
    public TMP_Text[] wordButtons;   // RIGHT side clickable words
    public Button matchingSubmitButton;
    public Button matchingNextButton;
    public TMP_Text matchingFeedbackText;

    [Header("Line Prefab")]
    public RectTransform linePrefab; // should be a UI Image (thin rect), raycast target disabled
    private List<RectTransform> lines = new List<RectTransform>();
    private Dictionary<int, RectTransform> lineFromImage = new Dictionary<int, RectTransform>();

    private Entity _player = null;
    private Entity _enemy = null;

    private QuestionType currentType;
    private WordItem currentWord;
    private List<WordItem> matchWords = new List<WordItem>();

    private int tempImageIndex = -1; // currently selected image
    private Dictionary<int, int> correctMatches = new Dictionary<int, int>(); // imageIndex -> wordIndex (logical)
    private Dictionary<int, int> playerMatches = new Dictionary<int, int>();  // player selections (imageIndex -> wordIndex)
    private int[] buttonIndexToWordIndex = new int[3]; // mapping after shuffling right-side words

    private void Awake()
    {
        this.SetupSingleton(ref Instance);
    }

    private void Start()
    {
        // Typing buttons
        typingSubmitButton.onClick.AddListener(CheckTypingAnswer);
        typingNextButton.onClick.AddListener(LoadNewWord);

        // Matching buttons
        matchingSubmitButton.onClick.AddListener(CheckMatchingAnswer);
        matchingNextButton.onClick.AddListener(LoadNewWord);
    }

    public void Setup(Entity player, Entity enemy)
    {
        totalCorrectRequired = Random.Range(3, 7);
        totalCorrectCount = 0;
        _player = player;
        _enemy = enemy;
        Show();
        StartCoroutine(DelaySetup());
    }

    private IEnumerator DelaySetup()
    {
        yield return null;

        LoadNewWord();
    }

    private void EndBattle()
    {
        Debug.Log("Battle complete!");
        MatchPanel.SetActive(false);
        TypeAnswerPanel.SetActive(false);

        Hide();

        _player.EndBattle(true);
        _enemy.EndBattle(false);
    }

    private void LoadNewWord()
    {
        // Destroy previous lines safely
        foreach (var line in lines)
        {
            if (line != null && line.gameObject != null)
                Destroy(line.gameObject);
        }
        lines.Clear();
        lineFromImage.Clear();

        playerMatches.Clear();
        correctMatches.Clear();
        tempImageIndex = -1;

        // Hide all panels/buttons first
        TypeAnswerPanel.SetActive(false);
        MatchPanel.SetActive(false);
        typingSubmitButton.gameObject.SetActive(false);
        typingNextButton.gameObject.SetActive(false);
        typingFeedbackText.gameObject.SetActive(false);
        matchingSubmitButton.gameObject.SetActive(false);
        matchingNextButton.gameObject.SetActive(false);
        matchingFeedbackText.gameObject.SetActive(false);

        // Random mode
        currentType = (Random.value > 0.5f) ? QuestionType.Typing : QuestionType.Matching;
        Debug.Log("Mode: " + currentType);

        if (currentType == QuestionType.Typing)
            LoadTypingQuestion();
        else
            LoadMatchingQuestion();
    }

    #region Typing Mode
    private void LoadTypingQuestion()
    {
        TypeAnswerPanel.SetActive(true);
        typingSubmitButton.gameObject.SetActive(true);
        typingNextButton.gameObject.SetActive(false);
        typingFeedbackText.gameObject.SetActive(false);

        currentWord = WordManager.Instance.getRandomWord();
        if (currentWord == null) return;

        questionText.text = "Translate: " + currentWord.slo_word;
        answerInput.text = "";
        wordImage.sprite = currentWord.image;
    }

    private void CheckTypingAnswer()
    {
        string playerAnswer = answerInput.text.ToLower().Trim();
        string correctAnswer = currentWord.eng_word.ToLower().Trim();

        bool isCorrect = playerAnswer == correctAnswer;

        if (isCorrect)
        {
            totalCorrectCount++;
            typingFeedbackText.text = $"Correct! ({totalCorrectCount}/{totalCorrectRequired})";
            typingFeedbackText.color = Color.green;

            _player.Attack();
        } else
        {
            typingFeedbackText.text = "Wrong! Correct: " + currentWord.eng_word;
            typingFeedbackText.color = Color.red;

            _enemy.Attack();
        }

        typingFeedbackText.gameObject.SetActive(true);
        typingSubmitButton.gameObject.SetActive(false);
        typingNextButton.gameObject.SetActive(true);

        // Check if battle is complete
        if (totalCorrectCount >= totalCorrectRequired)
        {
            EndBattle();
        }
    }


    #endregion

    #region Matching Mode
    private void LoadMatchingQuestion()
    {
        MatchPanel.SetActive(true);
        matchingSubmitButton.gameObject.SetActive(true);
        matchingNextButton.gameObject.SetActive(false);
        matchingFeedbackText.gameObject.SetActive(false);

        matchWords.Clear();

        // Pick 3 distinct words
        HashSet<WordItem> used = new HashSet<WordItem>();
        while (matchWords.Count < 3)
        {
            var w = WordManager.Instance.getRandomWord();
            if (w != null && !used.Contains(w))
            {
                used.Add(w);
                matchWords.Add(w);
            }
        }

        // Assign images (left side)
        for (int i = 0; i < 3; i++)
        {
            imageButtons[i].sprite = matchWords[i].image;
            imageButtons[i].color = Color.white;

            int index = i;
            var btn = imageButtons[i].GetComponent<Button>();
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(() => SelectImage(index));

            // correct matches (imageIndex -> wordIndex in logical order)
            correctMatches[i] = i;
        }

        // Shuffle right-side words
        List<int> order = new List<int> { 0, 1, 2 };
        for (int i = 0; i < order.Count; i++)
        {
            int r = Random.Range(0, order.Count);
            int tmp = order[i];
            order[i] = order[r];
            order[r] = tmp;
        }

        // Assign shuffled words and store mapping
        for (int i = 0; i < 3; i++)
        {
            int wordIndex = order[i]; // index into matchWords
            wordButtons[i].text = matchWords[wordIndex].eng_word;
            buttonIndexToWordIndex[i] = wordIndex;

            int index = i;
            var btn = wordButtons[i].GetComponentInParent<Button>();
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(() => SelectText(index));
        }

        questionText.text = "Match image to word!";
    }

    private void SelectImage(int index)
    {
        tempImageIndex = index;

        // visual feedback: slightly darken selected image, reset others
        for (int i = 0; i < imageButtons.Length; i++)
            imageButtons[i].color = (i == index) ? new Color(0.85f, 0.85f, 0.85f) : Color.white;

        // also reset word button visuals (optional)
        for (int i = 0; i < wordButtons.Length; i++)
        {
            var b = wordButtons[i].GetComponentInParent<Button>();
            if (b != null) b.image.color = Color.white;
        }
    }

    private void SelectText(int buttonIndex)
    {
        if (tempImageIndex == -1) return;

        int wordIndex = buttonIndexToWordIndex[buttonIndex];
        int imageIndex = tempImageIndex;

        // replace previous line if exists for this image (safe check)
        if (lineFromImage.TryGetValue(imageIndex, out var oldLine))
        {
            if (oldLine != null)
            {
                // remove from lines list if present
                lines.Remove(oldLine);
                Destroy(oldLine.gameObject);
            }
            lineFromImage.Remove(imageIndex);
        }

        // Create new line and store it
        RectTransform newLine = DrawLineBetween(imageButtons[imageIndex], wordButtons[buttonIndex].GetComponentInParent<Button>());

        if (newLine != null)
        {
            lineFromImage[imageIndex] = newLine;
            lines.Add(newLine);
        }

        // store logical mapping (imageIndex -> wordIndex)
        playerMatches[imageIndex] = wordIndex;

        // reset selection visual
        tempImageIndex = -1;
        for (int i = 0; i < imageButtons.Length; i++)
            imageButtons[i].color = Color.white;

        // optionally highlight the selected word button briefly
        var selectedBtn = wordButtons[buttonIndex].GetComponentInParent<Button>();
        if (selectedBtn != null) selectedBtn.image.color = new Color(0.9f, 0.9f, 0.9f);
    }

    private RectTransform DrawLineBetween(Image imgBtn, Button wordBtn)
    {
        if (linePrefab == null) return null;

        Canvas canvas = MatchPanel.GetComponentInChildren<Canvas>();
        RectTransform canvasRect = canvas.GetComponent<RectTransform>();

        RectTransform line = Instantiate(linePrefab, canvas.transform);

        // Ensure background is first
        Transform background = canvas.transform.Find("Background");
        if (background != null) background.SetAsFirstSibling();

        // Place line right after background
        if (background != null)
            line.SetSiblingIndex(background.GetSiblingIndex() + 1);
        else
            line.SetAsFirstSibling(); // fallback

        var lineImage = line.GetComponent<Image>();
        if (lineImage)
        {
            lineImage.raycastTarget = false;
            lineImage.color = Color.black;
        }

        Vector2 startPos, endPos;

        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            canvasRect,
            RectTransformUtility.WorldToScreenPoint(null, imgBtn.rectTransform.position),
            canvas.worldCamera,
            out startPos);

        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            canvasRect,
            RectTransformUtility.WorldToScreenPoint(null, wordBtn.GetComponent<RectTransform>().position),
            canvas.worldCamera,
            out endPos);

        line.anchoredPosition = (startPos + endPos) / 2f;
        Vector2 dir = endPos - startPos;
        line.sizeDelta = new Vector2(dir.magnitude, 5f);
        line.localRotation = Quaternion.Euler(0, 0, Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg);

        return line;
    }



    private void CheckMatchingAnswer()
    {
        if (playerMatches.Count < correctMatches.Count)
        {
            matchingFeedbackText.text = "Please match all images first!";
            matchingFeedbackText.gameObject.SetActive(true);
            return;
        }

        bool allCorrect = true;

        foreach (var kvp in correctMatches)
        {
            int imageIndex = kvp.Key;
            int correctWordIndex = kvp.Value;

            bool isCorrect = playerMatches.ContainsKey(imageIndex) && playerMatches[imageIndex] == correctWordIndex;
            allCorrect &= isCorrect;

            if (lineFromImage.TryGetValue(imageIndex, out var lineRect) && lineRect != null)
            {
                var img = lineRect.GetComponent<Image>();
                if (img != null)
                    img.color = isCorrect ? Color.green : Color.red;
            }
        }

        if (allCorrect)
        {
            totalCorrectCount++;
            matchingFeedbackText.text = $"All matches correct! ({totalCorrectCount}/{totalCorrectRequired})";
            matchingFeedbackText.color = Color.green;

            _player.Attack();
        } else
        {
            matchingFeedbackText.text = "Some matches are wrong!";
            matchingFeedbackText.color = Color.red;

            _enemy.Attack();
        }

        matchingFeedbackText.gameObject.SetActive(true);
        matchingSubmitButton.gameObject.SetActive(false);
        matchingNextButton.gameObject.SetActive(true);

        if (totalCorrectCount >= totalCorrectRequired)
        {
            EndBattle();
        }
    }
    #endregion
}
