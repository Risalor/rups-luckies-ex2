using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.Tilemaps;

public class GameWorld : MonoBehaviour
{
    public static GameWorld Instance = null;

    public Transform entityContainer;
    public Entity[] enemyPrefabs;
    public Tilemap spawnTilemap;
    public Player playerPrefab;
    public Transform playerSpawnPoint;

    private readonly Dictionary<GameObject, Entity> _entityMap = new();
    public Dictionary<GameObject, Entity> Entities => _entityMap;
    private Player _player = null;
    public Player Player => _player;

    public void Awake()
    {
        this.SetupSingleton(ref Instance);

        playerSpawnPoint.gameObject.SetActive(false);
        gameObject.SetActive(false);
    }

    public void StartGame()
    {
        this.SmartLog("Game started");
        gameObject.SetActive(true);

        SpawnPlayer();
        SpawnEnemiesOnTiles();
    }

    private void SpawnPlayer()
    {
        _player = Instantiate(playerPrefab, entityContainer);
        _player.Setup(playerSpawnPoint.position);
        _entityMap.Add(_player.gameObject, _player);
    }

    private void SpawnEnemiesOnTiles()
    {
        BoundsInt bounds = spawnTilemap.cellBounds;

        foreach (var pos in bounds.allPositionsWithin)
        {
            TileBase tile = spawnTilemap.GetTile(pos);
            if (tile == null) continue;

            Entity enemyPrefab = enemyPrefabs[Random.Range(0, enemyPrefabs.Length)];

            Vector3 worldPos = spawnTilemap.CellToWorld(pos) + new Vector3(0.5f, 0f, 0f);
            Entity newEnemy = Instantiate(enemyPrefab, entityContainer);
            newEnemy.Setup(worldPos);
            _entityMap.Add(newEnemy.gameObject, newEnemy);
        }
    }

    public void EndGame()
    {
        this.SmartLog("Game ended");
        gameObject.SetActive(false);

        GameManager.Instance.ReturnToMainMenu();
    }

    public void EntityDied(Entity entity)
    {
        _entityMap.Remove(entity.gameObject);
        if (_entityMap.Count == 1)
            StartCoroutine(WaitAndEndGame());
    }

    private IEnumerator WaitAndEndGame()
    {
        yield return new WaitForSecondsRealtime(1f);

        EndGame();
    }
}
